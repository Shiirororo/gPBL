from django.urls import path

from .views import (
    ConversationCloseView,
    ConversationDetailView,
    ConversationDraftView,
    ConversationListCreateView,
    ConversationMessageView,
    LockStatusView,
)


# Các URL đều nằm dưới /api/ai/ khi URLConf gốc include module này.
urlpatterns = [
    path("conversations/", ConversationListCreateView.as_view(), name="ai-conversations"),
    path(
        "conversations/<int:conversation_id>/",
        ConversationDetailView.as_view(),
        name="ai-conversation-detail",
    ),
    path(
        "conversations/<int:conversation_id>/draft/",
        ConversationDraftView.as_view(),
        name="ai-conversation-draft",
    ),
    path(
        "conversations/<int:conversation_id>/messages/",
        ConversationMessageView.as_view(),
        name="ai-conversation-messages",
    ),
    path(
        "conversations/<int:conversation_id>/close/",
        ConversationCloseView.as_view(),
        name="ai-conversation-close",
    ),
    path("lock-status/", LockStatusView.as_view(), name="ai-lock-status"),
]
