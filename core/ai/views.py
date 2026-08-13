from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import conversation_service
from .decorators import require_ai_unlocked
from .exceptions import (
    AIProviderUnavailable,
    ChallengeNotFoundError,
    ConversationClosedError,
    ConversationConflictError,
    ConversationNotFoundError,
    InvalidConversationStatusError,
)
from .lock_service import LockService
from .serializers import (
    AIConversationDetailSerializer,
    AIConversationSerializer,
    AIExchangeSerializer,
    CloseConversationSerializer,
    ConversationListQuerySerializer,
    CreateConversationSerializer,
    SaveDraftSerializer,
    SendMessageSerializer,
)


def _service_error_response(error):
    """Map service errors to stable HTTP responses for the frontend."""

    if isinstance(error, (ConversationNotFoundError, ChallengeNotFoundError)):
        return Response(
            {"error": {"code": "not_found", "message": str(error)}},
            status=status.HTTP_404_NOT_FOUND,
        )
    if isinstance(error, (ConversationConflictError, ConversationClosedError)):
        return Response(
            {"error": {"code": "conflict", "message": str(error)}},
            status=status.HTTP_409_CONFLICT,
        )
    if isinstance(error, InvalidConversationStatusError):
        return Response(
            {"error": {"code": "validation_error", "message": str(error)}},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if isinstance(error, AIProviderUnavailable):
        return Response(
            {
                "error": {
                    "code": "ai_unavailable",
                    "message": "The AI service is temporarily unavailable.",
                }
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return None


class ConversationListCreateView(APIView):
    """Create or list conversations owned by the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = ConversationListQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        conversations = conversation_service.list_conversations(
            user=request.user,
            challenge_id=query.validated_data.get("challenge_id"),
        )
        return Response(AIConversationSerializer(conversations, many=True).data)

    @require_ai_unlocked
    def post(self, request):
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            conversation = conversation_service.create_conversation(
                user=request.user,
                challenge_id=serializer.validated_data["challenge_id"],
            )
        except (ChallengeNotFoundError, ConversationConflictError) as error:
            return _service_error_response(error)
        return Response(
            AIConversationSerializer(conversation).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationDetailView(APIView):
    """Return a conversation with all stored code snapshots."""

    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            conversation = conversation_service.get_conversation(
                user=request.user,
                conversation_id=conversation_id,
            )
        except ConversationNotFoundError as error:
            return _service_error_response(error)
        return Response(AIConversationDetailSerializer(conversation).data)


class ConversationDraftView(APIView):
    """Autosave current code without creating an AI exchange."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, conversation_id):
        serializer = SaveDraftSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            conversation = conversation_service.save_draft(
                user=request.user,
                conversation_id=conversation_id,
                **serializer.validated_data,
            )
        except (
            ConversationNotFoundError,
            ConversationConflictError,
            ConversationClosedError,
            AIProviderUnavailable,
        ) as error:
            return _service_error_response(error)
        return Response(AIConversationSerializer(conversation).data)


class ConversationMessageView(APIView):
    """Send a question and current code, then return the AI exchange."""

    permission_classes = [IsAuthenticated]

    @require_ai_unlocked
    def post(self, request, conversation_id):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = conversation_service.send_message(
                user=request.user,
                conversation_id=conversation_id,
                **serializer.validated_data,
            )
        except (
            ConversationNotFoundError,
            ConversationConflictError,
            ConversationClosedError,
            AIProviderUnavailable,
        ) as error:
            return _service_error_response(error)

        return Response(
            AIExchangeSerializer(result).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationCloseView(APIView):
    """Close a conversation while preserving its history."""

    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        serializer = CloseConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            conversation = conversation_service.close_conversation(
                user=request.user,
                conversation_id=conversation_id,
                status=serializer.validated_data["status"],
            )
        except (
            ConversationNotFoundError,
            ConversationConflictError,
            ConversationClosedError,
            InvalidConversationStatusError,
        ) as error:
            return _service_error_response(error)
        return Response(AIConversationSerializer(conversation).data)


class LockStatusView(APIView):
    """Check current lock status for the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current AI lock status and remaining time."""
        is_locked = LockService.is_ai_locked(request.user)
        remaining_seconds = LockService.get_lock_remaining_time(request.user) if is_locked else 0
        expiry_time = LockService.get_lock_expiry(request.user)
        
        return Response({
            'ai_locked': is_locked,
            'remaining_seconds': remaining_seconds,
            'locked_until': expiry_time.isoformat() if expiry_time else None
        })
