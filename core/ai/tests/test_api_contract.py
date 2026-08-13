import uuid
import unittest

from django.test import SimpleTestCase

try:
    from rest_framework.permissions import IsAuthenticated
except ModuleNotFoundError as error:
    # Môi trường tối thiểu có thể chưa cài DRF; CI đầy đủ vẫn chạy toàn bộ contract test.
    raise unittest.SkipTest("Django REST Framework is not installed.") from error

from core.ai.serializers import (
    CloseConversationSerializer,
    CreateConversationSerializer,
    SaveDraftSerializer,
    SendMessageSerializer,
)
from core.ai.views import (
    ConversationCloseView,
    ConversationDetailView,
    ConversationDraftView,
    ConversationListCreateView,
    ConversationMessageView,
)


class ConversationRequestSerializerTests(SimpleTestCase):
    def test_create_accepts_only_a_positive_challenge_id(self):
        valid = CreateConversationSerializer(data={"challenge_id": 12})
        invalid = CreateConversationSerializer(data={"challenge_id": 0})

        self.assertTrue(valid.is_valid(), valid.errors)
        self.assertFalse(invalid.is_valid())

    def test_draft_and_message_require_current_challenge_id(self):
        draft = SaveDraftSerializer(data={"code": "", "expected_revision": 0})
        message = SendMessageSerializer(
            data={
                "question": "Why?",
                "code": "print(1)",
                "request_id": str(uuid.uuid4()),
                "expected_revision": 0,
            }
        )

        self.assertFalse(draft.is_valid())
        self.assertFalse(message.is_valid())
        self.assertIn("challenge_id", draft.errors)
        self.assertIn("challenge_id", message.errors)

    def test_draft_requires_code_and_non_negative_revision(self):
        valid = SaveDraftSerializer(
            data={"challenge_id": 12, "code": "", "expected_revision": 0}
        )
        invalid = SaveDraftSerializer(
            data={"challenge_id": 12, "code": "x", "expected_revision": -1}
        )

        self.assertTrue(valid.is_valid(), valid.errors)
        self.assertFalse(invalid.is_valid())

    def test_message_rejects_blank_question_and_invalid_request_id(self):
        for payload in (
            {
                "question": "   ",
                "challenge_id": 12,
                "code": "print(1)",
                "request_id": str(uuid.uuid4()),
                "expected_revision": 0,
            },
            {
                "question": "Why?",
                "challenge_id": 12,
                "code": "print(1)",
                "request_id": "not-a-uuid",
                "expected_revision": 0,
            },
        ):
            with self.subTest(payload=payload):
                serializer = SendMessageSerializer(data=payload)
                self.assertFalse(serializer.is_valid())

    def test_message_contract_does_not_accept_description_user_or_hint_level(self):
        serializer = SendMessageSerializer(
            data={
                "question": "Why?",
                "challenge_id": 12,
                "code": "print(1)",
                "request_id": str(uuid.uuid4()),
                "expected_revision": 0,
                "description": "Client-forged description",
                "user_id": 999,
                "hint_level": 3,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            set(serializer.errors),
            {"description", "user_id", "hint_level"},
        )

        # Description và user được backend lấy từ DB/JWT; hint_level do AI tự suy luận.

    def test_close_accepts_only_terminal_statuses(self):
        for accepted in ("completed", "abandoned"):
            with self.subTest(status=accepted):
                serializer = CloseConversationSerializer(data={"status": accepted})
                self.assertTrue(serializer.is_valid(), serializer.errors)

        serializer = CloseConversationSerializer(data={"status": "active"})
        self.assertFalse(serializer.is_valid())


class ConversationViewSecurityContractTests(SimpleTestCase):
    def test_every_conversation_view_requires_authentication(self):
        for view in (
            ConversationListCreateView,
            ConversationDetailView,
            ConversationDraftView,
            ConversationMessageView,
            ConversationCloseView,
        ):
            with self.subTest(view=view.__name__):
                self.assertIn(IsAuthenticated, view.permission_classes)
