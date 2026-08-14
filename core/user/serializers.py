from rest_framework import serializers

from core.models import User


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["user_name", "score", "avatar"]
        read_only_fields = ["user_name", "score"]
