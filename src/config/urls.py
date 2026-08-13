"""Root URL configuration for the project."""

from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("core.auth.urls")),
    path("api/ai/", include("core.ai.urls")),
    path("api/", include("core.submissions.urls")),
    path("api/challenges/", include("core.challenge.urls")),
    path("api/user/", include("core.user.urls")),
    path("api/leaderboard/", include("core.leaderboard.urls")),
    path("api/assessments/", include("core.assessments.urls")),
]
