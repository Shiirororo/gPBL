from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

from core.models import CodingChallenge, ChallengeSession
from core.ai.lock_service import LockService
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


class ChallengeStartView(APIView):
    """Start a challenge session and create AI assistance lock."""

    permission_classes = [IsAuthenticated]

    def post(self, request, challenge_id):
        """
        Start a new challenge session for the user.
        This creates a 10-minute AI assistance lock.
        """
        try:
            # Check if challenge exists
            challenge = CodingChallenge.objects.get(challenge_id=challenge_id)
        except CodingChallenge.DoesNotExist:
            return Response(
                {"error": "Challenge not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            with transaction.atomic():
                # Create or update challenge session
                session, created = ChallengeSession.objects.update_or_create(
                    user=request.user,
                    challenge=challenge,
                    defaults={
                        'status': 'active',
                        'started_at': timezone.now(),
                        'ended_at': None
                    }
                )

                # Create 10-minute AI lock
                lock = LockService.create_ai_lock(request.user, duration_minutes=10)
                
                if not lock:
                    return Response(
                        {"error": "Failed to create AI lock."}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                # Get lock expiry time
                lock_expiry = LockService.get_lock_expiry(request.user)

                response_data = {
                    'session_id': session.id,
                    'challenge_id': challenge.challenge_id,
                    'challenge_title': challenge.title,
                    'started_at': session.started_at.isoformat(),
                    'ai_locked': True,
                    'ai_locked_until': lock_expiry.isoformat() if lock_expiry else None,
                    'ai_lock_duration_minutes': 10,
                    'message': 'Challenge started successfully. AI assistance will be available in 10 minutes.',
                    'session_created': created
                }

                return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Failed to start challenge session: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
