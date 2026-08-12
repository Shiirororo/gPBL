from django.test import SimpleTestCase

from core.models import AIConversation, AIExchange


class AIConversationModelMetadataTests(SimpleTestCase):
    """Check ORM schema metadata without connecting to a real database."""

    def test_conversation_has_expected_table_relationships_and_defaults(self):
        meta = AIConversation._meta

        self.assertEqual(meta.db_table, "ai_conversations")
        self.assertEqual(meta.get_field("user").remote_field.related_name, "ai_conversations")
        self.assertEqual(
            meta.get_field("challenge").remote_field.related_name,
            "ai_conversations",
        )
        self.assertEqual(meta.get_field("status").default, AIConversation.Status.ACTIVE)
        self.assertEqual(meta.get_field("current_code").default, "")
        self.assertEqual(meta.get_field("revision").default, 0)

    def test_conversation_has_indexes_needed_for_resume_and_listing(self):
        indexed_fields = {tuple(index.fields) for index in AIConversation._meta.indexes}

        self.assertIn(("user", "challenge", "updated_at"), indexed_fields)
        self.assertIn(("user", "status", "updated_at"), indexed_fields)


class AIExchangeModelMetadataTests(SimpleTestCase):
    def test_exchange_stores_immutable_history_fields_and_orders_by_sequence(self):
        meta = AIExchange._meta

        self.assertEqual(meta.db_table, "ai_exchanges")
        self.assertEqual(meta.ordering, ["sequence", "exchange_id"])
        self.assertEqual(meta.get_field("conversation").remote_field.related_name, "exchanges")
        self.assertTrue(meta.get_field("request_id").unique)

        for field_name in (
            "sequence",
            "user_question",
            "code_snapshot",
            "assistant_hint",
            "created_at",
            "status",
        ):
            with self.subTest(field=field_name):
                self.assertIsNotNone(meta.get_field(field_name))

    def test_exchange_constraints_prevent_duplicate_or_invalid_sequence(self):
        constraints = {constraint.name: constraint for constraint in AIExchange._meta.constraints}

        unique = constraints["uq_aiexchange_conv_sequence"]
        self.assertEqual(tuple(unique.fields), ("conversation", "sequence"))
        self.assertIn("ck_aiexchange_sequence_gt_0", constraints)
