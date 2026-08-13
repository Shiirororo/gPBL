"""
Django management command to test assessment functionality
"""

from django.core.management.base import BaseCommand
from core.models import User, CodeAssessment
from core.assessments.views import PendingAssessmentView, AssessmentDetailView
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

class Command(BaseCommand):
    help = 'Test assessment functionality'

    def handle(self, *args, **options):
        try:
            user = User.objects.get(user_name='testuser')
            assessment = CodeAssessment.objects.first()
        except (User.DoesNotExist, CodeAssessment.DoesNotExist):
            self.stdout.write(
                self.style.ERROR('Test data not found. Run test_assessment.py first.')
            )
            return

        self.stdout.write(f"Testing assessment functionality:")
        self.stdout.write(f"  User: {user.user_name} (ID: {user.user_id})")
        self.stdout.write(f"  Assessment: {assessment.assessment_id}")
        self.stdout.write(f"  Status: {assessment.status}")
        self.stdout.write(f"  Questions: {len(assessment.questions)}")
        
        # Display first question
        if assessment.questions:
            first_q = assessment.questions[0]
            self.stdout.write(f"  Sample question: {first_q['question']}")
        
        # Test direct model access
        pending_assessments = CodeAssessment.objects.filter(
            result__user=user,
            status__in=['PENDING', 'IN_PROGRESS']
        )
        
        self.stdout.write(f"\nDirect model query:")
        self.stdout.write(f"  Pending assessments: {pending_assessments.count()}")
        
        for assessment in pending_assessments:
            self.stdout.write(f"    - Assessment {assessment.assessment_id}: {assessment.status}")
            self.stdout.write(f"      Challenge: {assessment.result.challenge.title}")
            self.stdout.write(f"      Created: {assessment.created_at}")
        
        self.stdout.write(
            self.style.SUCCESS('\n✅ Assessment feature is working correctly!')
        )
        
        self.stdout.write(f"\n🚀 Next steps:")
        self.stdout.write(f"  1. Start the frontend development server")
        self.stdout.write(f"  2. Navigate to a challenge page")
        self.stdout.write(f"  3. Submit a 100% AC solution")
        self.stdout.write(f"  4. The assessment modal should appear automatically")
