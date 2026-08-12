from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import CodingChallenge
from .serializers import CodingChallengeSerializer


class ChallengeDetailView(APIView):
    """
    View to retrieve a challenge by its ID.
    """

    def get(self, request, challenge_id=None):
        """
        Retrieve all challenges or one challenge by its ID.
        """
        if challenge_id is None:
            challenges = CodingChallenge.objects.all().order_by('challenge_id')
            serializer = CodingChallengeSerializer(challenges, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        try:
            challenge = CodingChallenge.objects.get(challenge_id=challenge_id)
            serializer = CodingChallengeSerializer(challenge)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CodingChallenge.DoesNotExist:
            return Response({"error": "Challenge not found."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        serializer = CodingChallengeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
