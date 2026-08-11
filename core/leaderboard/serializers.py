from rest_framework import serializers
from core.models import User

class LeaderboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'user_name',
            'score',
        ]
        read_only_fields = ['user_name', 'score']