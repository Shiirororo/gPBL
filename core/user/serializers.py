from rest_framework import serializers
from core.models import User

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'user_name', 'score']
        # Prevent users from modifying their own user_id or score directly
        read_only_fields = ['user_id', 'score']