from django.db import IntegrityError, transaction
from django.db.models import Max
from django.utils import timezone

from core.models import AIConversation, AIExchange

from .ai_service import (
    AIConfigurationError,
    AIInputValidationError,
    AIServiceError,
    generate_hint,
)
from .exceptions import (
    AIProviderUnavailable,
    ConversationClosedError,
    ConversationConflictError,
    InvalidConversationStatusError,
)
from .repositories import ConversationRepository


FINAL_STATUSES = frozenset({"completed", "abandoned"})
MAX_HISTORY_LENGTH = 20_000


class ConversationService:
    """Coordinate challenge sessions and AI conversation exchanges."""

    def __init__(self, repository=None, hint_generator=generate_hint):
        self.repository = repository or ConversationRepository()
        self.hint_generator = hint_generator

    def create_conversation(self, *, user, challenge_id):
        challenge = self.repository.get_challenge(challenge_id)
        # Description luôn được đọc từ challenge ở server; client không thể giả mạo đề bài.
        starter_code = challenge.starter_code or ""
        return self.repository.create(
            user=user,
            challenge=challenge,
            current_code=starter_code,
        )

    def list_conversations(self, *, user, challenge_id=None):
        return self.repository.list_for_user(user=user, challenge_id=challenge_id)

    def get_conversation(self, *, user, conversation_id):
        return self.repository.get_for_user(
            user=user,
            conversation_id=conversation_id,
        )

    def autosave(self, *, user, conversation_id, code, expected_revision):
        conversation = self.repository.autosave(
            user=user,
            conversation_id=conversation_id,
            code=code,
            expected_revision=expected_revision,
        )
        if conversation.status != "active":
            raise ConversationClosedError("Conversation is already closed.")
        return conversation

    # Tên public này khớp trực tiếp với endpoint lưu bản nháp.
    def save_draft(self, **kwargs):
        return self.autosave(**kwargs)

    def append_message(
        self,
        *,
        user,
        conversation_id,
        question,
        code,
        request_id,
        expected_revision,
    ):
        existing = self._find_existing_request(
            user=user,
            conversation_id=conversation_id,
            request_id=request_id,
        )
        if existing is not None:
            return self._idempotent_result(existing)

        exchange, description, history = self._prepare_exchange(
            user=user,
            conversation_id=conversation_id,
            question=question,
            code=code,
            request_id=request_id,
            expected_revision=expected_revision,
        )

        if description is None:
            return self._idempotent_result(exchange)

        # Không giữ transaction/database lock trong lúc chờ dịch vụ OpenAI phản hồi.
        try:
            hint = self.hint_generator(
                problem_description=description,
                user_code=code,
                user_question=question,
                history=history,
            )
        except (AIConfigurationError, AIInputValidationError, AIServiceError) as error:
            AIExchange.objects.filter(pk=exchange.pk, status="pending").update(
                status="failed"
            )
            raise AIProviderUnavailable(
                "The AI provider could not generate a hint."
            ) from error
        except Exception:
            AIExchange.objects.filter(pk=exchange.pk, status="pending").update(
                status="failed"
            )
            raise

        conversation_closed = False
        with transaction.atomic():
            conversation = self.repository.get_for_user(
                user=user,
                conversation_id=exchange.conversation_id,
                for_update=True,
            )
            if conversation.status != "active":
                AIExchange.objects.filter(pk=exchange.pk, status="pending").update(
                    status="failed"
                )
                conversation_closed = True
            else:
                AIExchange.objects.filter(pk=exchange.pk, status="pending").update(
                    assistant_hint=hint,
                    status="completed",
                )

        # Kiểm tra lại khi AI trả lời để không hoàn tất hint trong một phiên đã đóng.
        if conversation_closed:
            raise ConversationClosedError(
                "Conversation was closed while AI was responding."
            )

        exchange.refresh_from_db()
        return exchange

    # Tên public này khớp trực tiếp với endpoint gửi tin nhắn.
    def send_message(self, **kwargs):
        return self.append_message(**kwargs)

    def close_conversation(self, *, user, conversation_id, status):
        if status not in FINAL_STATUSES:
            raise InvalidConversationStatusError(
                "Status must be completed or abandoned."
            )

        with transaction.atomic():
            conversation = self.repository.get_for_user(
                user=user,
                conversation_id=conversation_id,
                for_update=True,
            )
            if conversation.status != "active":
                raise ConversationClosedError("Conversation is already closed.")
            AIConversation.objects.filter(pk=conversation.pk).update(
                status=status,
                ended_at=timezone.now(),
                updated_at=timezone.now(),
            )
            conversation.refresh_from_db()
        return conversation

    def _find_existing_request(self, *, user, conversation_id, request_id):
        conversation = self.repository.get_for_user(
            user=user,
            conversation_id=conversation_id,
        )
        return self.repository.get_exchange_by_request_id(
            conversation=conversation,
            request_id=request_id,
        )

    @staticmethod
    def _idempotent_result(exchange):
        # Retry cùng request_id trả lại kết quả cũ và không gọi OpenAI lần thứ hai.
        if exchange.status == "completed":
            return exchange
        raise ConversationConflictError(
            "This request is already pending or previously failed."
        )

    def _prepare_exchange(
        self,
        *,
        user,
        conversation_id,
        question,
        code,
        request_id,
        expected_revision,
    ):
        try:
            with transaction.atomic():
                conversation = self.repository.get_for_user(
                    user=user,
                    conversation_id=conversation_id,
                    for_update=True,
                )
                if conversation.status != "active":
                    raise ConversationClosedError("Conversation is already closed.")
                if conversation.revision != expected_revision:
                    raise ConversationConflictError(
                        "The conversation changed before this message was sent."
                    )

                existing = self.repository.get_exchange_by_request_id(
                    conversation=conversation,
                    request_id=request_id,
                )
                if existing is not None:
                    return existing, None, None

                last_sequence = (
                    AIExchange.objects.filter(conversation=conversation).aggregate(
                        value=Max("sequence")
                    )["value"]
                    or 0
                )
                history = self._build_history(conversation)
                exchange = AIExchange.objects.create(
                    conversation=conversation,
                    sequence=last_sequence + 1,
                    user_question=question,
                    code_snapshot=code,
                    assistant_hint="",
                    request_id=request_id,
                    status="pending",
                )
                conversation.current_code = code
                conversation.revision += 1
                conversation.save(
                    update_fields=["current_code", "revision", "updated_at"]
                )

                # Revision được giữ chỗ ngay để hai message đồng thời không dùng cùng phiên bản.
                return exchange, conversation.challenge.description, history
        except IntegrityError as error:
            # Unique request_id/sequence bảo vệ thêm khi nhiều request đến đồng thời.
            raise ConversationConflictError(
                "The same message is already being processed."
            ) from error

    def _build_history(self, conversation):
        parts = []
        for exchange in self.repository.completed_exchanges(
            conversation=conversation
        ):
            parts.append(
                "USER QUESTION:\n"
                f"{exchange.user_question}\n"
                "CODE SNAPSHOT:\n"
                f"{exchange.code_snapshot}\n"
                "AI HINT:\n"
                f"{exchange.assistant_hint}"
            )

        # Giữ các lượt gần nhất trong prompt nhưng toàn bộ snapshot vẫn nằm trong DB.
        history = "\n\n---\n\n".join(parts)
        return history[-MAX_HISTORY_LENGTH:]


# Các hàm mỏng bên dưới là giao diện ổn định để views gọi mà không cần biết cách
# khởi tạo repository/service. Class phía trên vẫn cho phép unit test inject mock.
def create_conversation(*, user, challenge_id):
    return ConversationService().create_conversation(
        user=user,
        challenge_id=challenge_id,
    )


def list_conversations(*, user, challenge_id=None):
    return ConversationService().list_conversations(
        user=user,
        challenge_id=challenge_id,
    )


def get_conversation(*, user, conversation_id):
    return ConversationService().get_conversation(
        user=user,
        conversation_id=conversation_id,
    )


def save_draft(*, user, conversation_id, code, expected_revision):
    return ConversationService().save_draft(
        user=user,
        conversation_id=conversation_id,
        code=code,
        expected_revision=expected_revision,
    )


def send_message(
    *, user, conversation_id, question, code, request_id, expected_revision
):
    return ConversationService().send_message(
        user=user,
        conversation_id=conversation_id,
        question=question,
        code=code,
        request_id=request_id,
        expected_revision=expected_revision,
    )


def close_conversation(*, user, conversation_id, status):
    return ConversationService().close_conversation(
        user=user,
        conversation_id=conversation_id,
        status=status,
    )
