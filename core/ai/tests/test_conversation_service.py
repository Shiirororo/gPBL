import uuid
from contextlib import nullcontext
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from core.ai.conversation_service import ConversationService
from core.ai.exceptions import (
    ConversationClosedError,
    ConversationConflictError,
    InvalidConversationStatusError,
)


class ConversationLifecycleServiceTests(SimpleTestCase):
    def setUp(self):
        self.repository = Mock()
        self.hint_generator = Mock(return_value="Think about the loop condition.")
        self.service = ConversationService(
            repository=self.repository,
            hint_generator=self.hint_generator,
        )
        self.user = SimpleNamespace(user_id=7)

    def test_create_uses_starter_code_from_server_side_challenge(self):
        challenge = SimpleNamespace(
            challenge_id=11,
            description="Server-owned description",
            starter_code="def solve():\n    pass",
        )
        self.repository.get_challenge.return_value = challenge
        created = SimpleNamespace(conversation_id=1)
        self.repository.create.return_value = created

        result = self.service.create_conversation(user=self.user, challenge_id=11)

        self.assertIs(result, created)
        self.repository.create.assert_called_once_with(
            user=self.user,
            challenge=challenge,
            current_code=challenge.starter_code,
        )

    def test_list_and_get_are_always_scoped_to_current_user(self):
        self.service.list_conversations(user=self.user, challenge_id=11)
        self.service.get_conversation(user=self.user, conversation_id=3)

        self.repository.list_for_user.assert_called_once_with(
            user=self.user,
            challenge_id=11,
        )
        self.repository.get_for_user.assert_called_once_with(
            user=self.user,
            conversation_id=3,
        )

    def test_autosave_delegates_expected_revision_and_returns_new_revision(self):
        saved = SimpleNamespace(status="active", revision=5, current_code="new code")
        self.repository.autosave.return_value = saved

        result = self.service.autosave(
            user=self.user,
            conversation_id=3,
            challenge_id=11,
            code="new code",
            expected_revision=4,
        )

        self.assertIs(result, saved)
        self.repository.autosave.assert_called_once_with(
            user=self.user,
            conversation_id=3,
            challenge_id=11,
            code="new code",
            expected_revision=4,
        )

    def test_autosave_rejects_closed_conversation(self):
        self.repository.autosave.return_value = SimpleNamespace(status="completed")

        with self.assertRaises(ConversationClosedError):
            self.service.autosave(
                user=self.user,
                conversation_id=3,
                challenge_id=11,
                code="code",
                expected_revision=1,
            )

    def test_close_validates_status_before_accessing_database(self):
        with self.assertRaises(InvalidConversationStatusError):
            self.service.close_conversation(
                user=self.user,
                conversation_id=3,
                status="active",
            )

        self.repository.get_for_user.assert_not_called()


class MessageHistoryServiceTests(SimpleTestCase):
    def setUp(self):
        self.repository = Mock()
        self.hint_generator = Mock(return_value="Hint generated safely")
        self.service = ConversationService(
            repository=self.repository,
            hint_generator=self.hint_generator,
        )
        self.user = SimpleNamespace(user_id=7)

    def test_history_keeps_question_code_and_hint_in_sequence(self):
        conversation = SimpleNamespace(conversation_id=3)
        self.repository.completed_exchanges.return_value = [
            SimpleNamespace(
                user_question="First question",
                code_snapshot="code version 1",
                assistant_hint="First hint",
            ),
            SimpleNamespace(
                user_question="Second question",
                code_snapshot="code version 2",
                assistant_hint="Second hint",
            ),
        ]

        history = self.service._build_history(conversation)

        self.assertLess(history.index("code version 1"), history.index("code version 2"))
        for expected in ("First question", "First hint", "Second question", "Second hint"):
            self.assertIn(expected, history)

        # Mỗi snapshot được giữ riêng để AI nhìn thấy quá trình thay đổi code.

    def test_completed_retry_returns_existing_exchange_without_calling_ai(self):
        existing = SimpleNamespace(status="completed", assistant_hint="Existing hint")
        conversation = SimpleNamespace(status="active")
        self.repository.get_for_user.return_value = conversation
        self.repository.get_exchange_by_request_id.return_value = existing

        result = self.service.append_message(
            user=self.user,
            conversation_id=3,
            challenge_id=11,
            question="Why?",
            code="code version 2",
            request_id=uuid.uuid4(),
            expected_revision=2,
        )

        self.assertIs(result, existing)
        self.repository.get_for_user.assert_called_once_with(
            user=self.user,
            conversation_id=3,
            challenge_id=11,
        )
        self.hint_generator.assert_not_called()

    def test_pending_or_failed_retry_is_reported_as_conflict(self):
        for status in ("pending", "failed"):
            with self.subTest(status=status):
                self.repository.reset_mock()
                self.repository.get_for_user.return_value = SimpleNamespace(status="active")
                self.repository.get_exchange_by_request_id.return_value = SimpleNamespace(
                    status=status
                )
                with self.assertRaises(ConversationConflictError):
                    self.service.append_message(
                        user=self.user,
                        conversation_id=3,
                        challenge_id=11,
                        question="Why?",
                        code="code",
                        request_id=uuid.uuid4(),
                        expected_revision=2,
                    )

                self.hint_generator.assert_not_called()

    @patch("core.ai.conversation_service.transaction.atomic", side_effect=lambda: nullcontext())
    @patch("core.ai.conversation_service.AIConversation.objects")
    @patch("core.ai.conversation_service.AIExchange.objects")
    def test_new_message_uses_server_description_and_keeps_snapshot_immutable(
        self,
        exchange_objects,
        conversation_objects,
        _atomic,
    ):
        request_id = uuid.uuid4()
        exchange = Mock(
            pk=9,
            conversation_id=3,
            code_snapshot="code version 2",
            status="pending",
        )
        self.repository.get_for_user.return_value = SimpleNamespace(status="active")
        self.repository.get_exchange_by_request_id.return_value = None
        self.service._prepare_exchange = Mock(
            return_value=(exchange, "Server-owned description", "Previous history")
        )
        exchange_objects.filter.return_value.update.return_value = 1
        conversation_objects.filter.return_value.update.return_value = 1

        result = self.service.append_message(
            user=self.user,
            conversation_id=3,
            challenge_id=11,
            question="What changed?",
            code="code version 2",
            request_id=request_id,
            expected_revision=2,
        )

        self.assertIs(result, exchange)
        self.hint_generator.assert_called_once_with(
            problem_description="Server-owned description",
            user_code="code version 2",
            user_question="What changed?",
            history="Previous history",
        )
        self.assertEqual(exchange.code_snapshot, "code version 2")
        exchange.refresh_from_db.assert_called_once_with()

