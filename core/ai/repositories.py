from django.db.models import F
from django.utils import timezone

from core.models import AIConversation, AIExchange, CodingChallenge

from .exceptions import (
    ChallengeNotFoundError,
    ConversationConflictError,
    ConversationNotFoundError,
)


class ConversationRepository:
    """Centralize queries and always scope conversation data to its owner."""

    def get_challenge(self, challenge_id):
        try:
            return CodingChallenge.objects.get(pk=challenge_id)
        except CodingChallenge.DoesNotExist as error:
            raise ChallengeNotFoundError("Challenge does not exist.") from error

    def create(self, *, user, challenge, current_code):
        return AIConversation.objects.create(
            user=user,
            challenge=challenge,
            current_code=current_code,
            status="active",
        )

    def list_for_user(self, *, user, challenge_id=None):
        # Scope theo user ngăn một tài khoản xem lịch sử học của tài khoản khác.
        conversations = AIConversation.objects.filter(user=user).select_related(
            "challenge"
        )
        if challenge_id is not None:
            conversations = conversations.filter(challenge_id=challenge_id)
        return conversations.order_by("-updated_at", "-pk")

    def get_for_user(
        self, *, user, conversation_id, challenge_id=None, for_update=False
    ):
        conversations = AIConversation.objects.filter(user=user).select_related(
            "challenge"
        )
        if challenge_id is not None:
            conversations = conversations.filter(challenge_id=challenge_id)
        if for_update:
            conversations = conversations.select_for_update()
        try:
            return conversations.get(pk=conversation_id)
        except AIConversation.DoesNotExist as error:
            raise ConversationNotFoundError("Conversation does not exist.") from error

    def autosave(
        self, *, user, conversation_id, challenge_id, code, expected_revision
    ):
        # Optimistic locking chỉ cập nhật khi client đang giữ đúng revision mới nhất.
        updated = AIConversation.objects.filter(
            pk=conversation_id,
            user=user,
            challenge_id=challenge_id,
            status="active",
            revision=expected_revision,
        ).update(
            current_code=code,
            revision=F("revision") + 1,
            updated_at=timezone.now(),
        )
        if updated:
            return self.get_for_user(
                user=user,
                conversation_id=conversation_id,
                challenge_id=challenge_id,
            )

        conversation = self.get_for_user(
            user=user,
            conversation_id=conversation_id,
            challenge_id=challenge_id,
        )
        if conversation.status != "active":
            return conversation
        raise ConversationConflictError(
            "The draft changed before this request was saved."
        )

    def get_exchange_by_request_id(self, *, conversation, request_id):
        return AIExchange.objects.filter(
            conversation=conversation,
            request_id=request_id,
        ).first()

    def completed_exchanges(self, *, conversation):
        # Chỉ nội dung hoàn tất mới được đưa vào prompt, theo đúng thứ tự hội thoại.
        return AIExchange.objects.filter(
            conversation=conversation,
            status="completed",
        ).order_by("sequence", "pk")
