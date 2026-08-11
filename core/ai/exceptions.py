class ConversationServiceError(RuntimeError):
    """Base error for the AI conversation service layer."""


class ConversationNotFoundError(ConversationServiceError):
    """Raised when the current user does not own the requested conversation."""


class ChallengeNotFoundError(ConversationServiceError):
    """Raised when the requested challenge does not exist."""


class ConversationConflictError(ConversationServiceError):
    """Raised when data changed or the request is already being processed."""


class ConversationClosedError(ConversationServiceError):
    """Raised when attempting to modify a closed conversation."""


class InvalidConversationStatusError(ConversationServiceError, ValueError):
    """Raised when a conversation is closed with an invalid status."""


class AIProviderUnavailable(ConversationServiceError):
    """Raised when the AI provider cannot return a hint."""


# Các alias dưới đây giữ contract ngắn gọn cho tầng API mà không làm mất ý nghĩa
# cụ thể của exception trong tầng service.
AIConversationNotFound = ConversationNotFoundError
Conflict = ConversationConflictError
ValidationError = InvalidConversationStatusError
