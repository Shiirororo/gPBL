from django.urls import path
from .views import ChallengeDetailView

urlpatterns = [
    path('challenge/<int:challenge_id>/', ChallengeDetailView.as_view(), name='challenge-detail'),
    path('challenge/', ChallengeDetailView.as_view(), name='challenge-create'),
]