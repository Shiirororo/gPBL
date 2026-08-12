from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import conversation_service
from .exceptions import (
    AIProviderUnavailable,
    ChallengeNotFoundError,
    ConversationClosedError,
    ConversationConflictError,
    ConversationNotFoundError,
    InvalidConversationStatusError,
)
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
