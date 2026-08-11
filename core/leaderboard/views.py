from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import User
from .serializers import LeaderboardSerializer

class LeaderboardView(APIView):
    """
    View to retrieve the leaderboard.
    """

    def get(self, request):
        """
        Retrieve the leaderboard.
        """
        users = User.objects.order_by('-score')[:10]  # Get top 10 users by score
        serializer = LeaderboardSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)