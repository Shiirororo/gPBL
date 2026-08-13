import json

from rest_framework import serializers
from core.models import CodingChallenge, ChallengeSession


class CodingChallengeSerializer(serializers.ModelSerializer):
    # MySQL may return JSONField values as a raw JSON string when rows were
    # inserted via raw SQL rather than the ORM. This field normalises the value
    # to always be a list so the frontend never receives a bare string.
    categories = serializers.SerializerMethodField()

    class Meta:
        model = CodingChallenge
        fields = [
            "challenge_id",
            "title",
            "description",
            "difficulty",
            "hint",
            "starter_code",
            "score",
            "categories",
            "learning_status",
            "example_of_correct_code",
            "acceptance_rate",
        ]
        read_only_fields = ["challenge_id"]

    def get_categories(self, obj) -> list:
        """Return categories as a list, parsing JSON strings if necessary."""
        value = obj.categories
        if value is None:
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                return parsed if isinstance(parsed, list) else []
            except (json.JSONDecodeError, ValueError):
                return []
        return []

    def validate_title(self, value):
        if CodingChallenge.objects.filter(title=value).exists():
            raise serializers.ValidationError("Challenge với title này đã tồn tại")
        return value


class ChallengeSessionSerializer(serializers.ModelSerializer):
    challenge_title = serializers.CharField(source='challenge.title', read_only=True)
    user_name = serializers.CharField(source='user.user_name', read_only=True)
    
    class Meta:
        model = ChallengeSession
        fields = [
            'id', 'user_name', 'challenge_title', 'started_at', 
            'ended_at', 'status'
        ]
        read_only_fields = ['id', 'started_at']