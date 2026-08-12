"""
core/submissions/urls.py

URL patterns for the submission module.

Mounted at /api/ in config/urls.py, giving:

  POST /api/challenge/<challenge_id>/submit/       — submit code
  GET  /api/challenge/<challenge_id>/submissions/  — list own submissions
  GET  /api/submissions/<result_id>/               — get one result
"""

from django.urls import path

from .views import SubmitView, SubmissionListView, SubmissionDetailView

urlpatterns = [
    # Code submission
    path(
        "challenge/<int:challenge_id>/submit/",
        SubmitView.as_view(),
        name="submit",
    ),

    # History for one challenge
    path(
        "challenge/<int:challenge_id>/submissions/",
        SubmissionListView.as_view(),
        name="submission-list",
    ),

    # Single result detail
    path(
        "submissions/<int:result_id>/",
        SubmissionDetailView.as_view(),
        name="submission-detail",
    ),
]
