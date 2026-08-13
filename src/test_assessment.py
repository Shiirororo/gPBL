#!/usr/bin/env python3
"""
Test script to simulate a 100% AC submission and trigger assessment creation
"""

import os
import sys
import django
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django.setup()

from core.models import User, CodingChallenge, Result, CodeAssessment
from core.judge.runner import ExecutionStatus
from core.judge.evaluator import EvaluationResult, TestCaseResult
from core.submissions.service import SubmissionService

def test_assessment_creation():
    """Test creating an assessment after 100% AC submission"""
    
    # Get test data
    try:
        user = User.objects.get(user_name='testuser')
        challenge = CodingChallenge.objects.get(challenge_id=1)
    except (User.DoesNotExist, CodingChallenge.DoesNotExist):
        print("Sample data not found. Run create_sample_data.py first.")
        return
    
    # Sample AC code
    code = '''def two_sum(nums, target):
    num_to_index = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_to_index:
            return [num_to_index[complement], i]
        num_to_index[num] = i
    return []'''
    
    print(f"Testing assessment creation for user: {user.user_name}")
    print(f"Challenge: {challenge.title}")
    print(f"Code length: {len(code)} characters")
    
    # Create mock evaluation result (100% AC)
    test_case_results = [
        TestCaseResult(
            testcase_id=i+1,
            status=ExecutionStatus.ACCEPTED,
            actual_output=f"[0, 1]",  # Mock output
            expected_output=f"[0, 1]",
            stderr="",
            runtime_ms=10,
            is_hidden=(i >= 3)
        ) for i in range(5)  # 5 test cases, all pass
    ]
    
    eval_result = EvaluationResult(
        status=ExecutionStatus.ACCEPTED,
        passed=5,
        total=5,
        details=test_case_results
    )
    
    # Use submission service to create result and trigger assessment
    service = SubmissionService()
    try:
        result_data = service._persist(
            user=user,
            challenge=challenge,
            code=code,
            eval_result=eval_result
        )
        
        print(f"\nSubmission result created: {result_data.result_id}")
        
        # Check if assessment was created
        try:
            assessment = CodeAssessment.objects.get(result=result_data)
            print(f"✅ Assessment created successfully!")
            print(f"   Assessment ID: {assessment.assessment_id}")
            print(f"   Status: {assessment.status}")
            print(f"   Questions count: {len(assessment.questions)}")
            
            # Print sample questions
            print(f"\n📝 Sample questions:")
            for i, q in enumerate(assessment.questions[:2]):
                print(f"   {i+1}. {q['question']}")
            
            print(f"\n🔗 API endpoints to test:")
            print(f"   GET /api/assessments/pending/ - Check for pending assessments")
            print(f"   GET /api/assessments/{assessment.assessment_id}/ - Get assessment details")
            print(f"   POST /api/assessments/{assessment.assessment_id}/ - Submit answers")
            
        except CodeAssessment.DoesNotExist:
            print("❌ Assessment was not created")
            print("Check if OPENAI_API_KEY is set and assessment feature is enabled")
            
    except Exception as e:
        print(f"❌ Error creating submission: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_assessment_creation()
