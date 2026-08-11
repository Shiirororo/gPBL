from rest_framework import serializers

from core.models import AIConversation, AIExchange


class StrictSerializer(serializers.Serializer):
    """Reject fields outside the API contract instead of ignoring them."""

    def to_internal_value(self, data):
        # description, user_id và hint_level không thuộc contract nên cũng bị chặn ở đây.
        unknown_fields = set(data) - set(self.fields)
        if unknown_fields:
            raise serializers.ValidationError(
                {field: ["This field is not allowed."] for field in unknown_fields}
            )
        return super().to_internal_value(data)


class CreateConversationSerializer(StrictSerializer):
    """Validate data used to start a challenge session."""

    # Client chỉ được gửi challenge_id; user được lấy từ JWT ở view.
    challenge_id = serializers.IntegerField(min_value=1)


class ConversationListQuerySerializer(StrictSerializer):
    """Validate optional filters used when listing conversations."""

    challenge_id = serializers.IntegerField(min_value=1, required=False)


class SaveDraftSerializer(StrictSerializer):
    """Validate the latest code and revision observed by the client."""

    code = serializers.CharField(
        allow_blank=True,
        trim_whitespace=False,
        max_length=20_000,
    )
    expected_revision = serializers.IntegerField(min_value=0)


class SendMessageSerializer(StrictSerializer):
    """Validate an AI request without accepting server-owned fields."""

    question = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
        max_length=2_000,
    )
    code = serializers.CharField(
        allow_blank=True,
        trim_whitespace=False,
        max_length=20_000,
    )
    request_id = serializers.UUIDField()
    expected_revision = serializers.IntegerField(min_value=0)

    def validate_question(self, value):
        # Không cho phép chuỗi chỉ chứa khoảng trắng đi qua API.
        if not value.strip():
            raise serializers.ValidationError("Question must not be blank.")
        return value


class CloseConversationSerializer(StrictSerializer):
    """Allow a conversation to close only with a terminal status."""

    status = serializers.ChoiceField(
        choices=(
            AIConversation.Status.COMPLETED,
            AIConversation.Status.ABANDONED,
        )
    )


class AIExchangeSerializer(serializers.ModelSerializer):
    """Serialize an immutable question, hint, and code snapshot."""

    class Meta:
        model = AIExchange
        fields = (
            "exchange_id",
            "sequence",
            "user_question",
            "code_snapshot",
            "assistant_hint",
            "created_at",
            "request_id",
            "status",
        )
        read_only_fields = fields


class AIConversationSerializer(serializers.ModelSerializer):
    """Serialize a challenge conversation summary."""

    class Meta:
        model = AIConversation
        fields = (
            "conversation_id",
            "challenge_id",
            "status",
            "current_code",
            "revision",
            "started_at",
            "updated_at",
            "ended_at",
        )
        read_only_fields = fields


class AIConversationDetailSerializer(AIConversationSerializer):
    """Serialize a complete conversation with ordered history."""

    exchanges = AIExchangeSerializer(many=True, read_only=True)

    class Meta(AIConversationSerializer.Meta):
        fields = AIConversationSerializer.Meta.fields + ("exchanges",)
