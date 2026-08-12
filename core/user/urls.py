from django.urls import path
from .views import UserProfileView

urlpatterns = [
    # Endpoint for accessing/updating current user's profile (/api/user/me/)
    path('me/', UserProfileView.as_view(), name='user-me'),
]