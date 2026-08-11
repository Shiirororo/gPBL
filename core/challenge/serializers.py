from rest_framework import serializers
from core.models import CodingChallenge

class CodingChallengeSerializer(serializers.ModelSerializer):
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
            "acceptance_rate"
        ]
        read_only_fields = ['challenge_id']
    
    def validate_title(self, value):
        if CodingChallenge.objects.filter(title=value).exists():
            raise serializers.ValidationError("Challenge với title này đã tồn tại")
        return value
        