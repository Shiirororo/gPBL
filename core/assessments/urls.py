"""
Assessment URL Configuration
"""

from django.urls import path
from .views import PendingAssessmentView, AssessmentDetailView

urlpatterns = [
    path('pending/', PendingAssessmentView.as_view(), name='pending_assessment'),
    path('<int:assessment_id>/', AssessmentDetailView.as_view(), name='assessment_detail'),
]
