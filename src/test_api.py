#!/usr/bin/env python3
"""
Test the assessment API endpoints directly
"""

import os
import sys
import django
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from core.models import User, CodeAssessment

def test_assessment_api():
    """Test assessment API endpoints"""
    
    client = Client()
    
    try:
        user = User.objects.get(user_name='testuser')
        assessment = CodeAssessment.objects.first()
    except (User.DoesNotExist, CodeAssessment.DoesNotExist):
        print("Test data not found. Run test_assessment.py first.")
        return
    
    # Login the user
    client.force_login(user)
    
    print(f"Testing API endpoints for user: {user.user_name}")
    print(f"Assessment ID: {assessment.assessment_id}")
    
    # Test 1: Check pending assessments
    print("\n1. Testing GET /api/assessments/pending/")
    response = client.get('/api/assessments/pending/')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Has pending: {data.get('has_pending')}")
        if data.get('has_pending'):
            print(f"   Assessment ID: {data.get('assessment_id')}")
            print(f"   Challenge: {data.get('challenge_title')}")
    
    # Test 2: Get assessment details
    print(f"\n2. Testing GET /api/assessments/{assessment.assessment_id}/")
    response = client.get(f'/api/assessments/{assessment.assessment_id}/')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Status: {data.get('status')}")
        print(f"   Questions count: {len(data.get('questions', []))}")
        print(f"   Challenge: {data.get('challenge', {}).get('title')}")
        
        # Print first question
        questions = data.get('questions', [])
        if questions:
            print(f"   First question: {questions[0].get('question')[:100]}...")
    
    # Test 3: Submit sample answers
    print(f"\n3. Testing POST /api/assessments/{assessment.assessment_id}/ (submit answers)")
    
    # Get questions first
    response = client.get(f'/api/assessments/{assessment.assessment_id}/')
    if response.status_code == 200:
        questions = response.json().get('questions', [])
        
        # Create sample answers
        answers = {}
        for q in questions:
            qid = str(q['id'])
            answers[qid] = f"Sample answer for question {qid}. This is a test response explaining the code functionality and approach."
        
        # Submit answers
        response = client.post(
            f'/api/assessments/{assessment.assessment_id}/',
            data={'answers': answers},
            content_type='application/json'
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Message: {data.get('message')}")
            print(f"   AI Score: {data.get('ai_score')}")
            print(f"   Feedback: {data.get('ai_feedback', '')[:100]}...")
        else:
            print(f"   Error: {response.content.decode()}")
    
    print("\n✅ API testing completed!")

if __name__ == '__main__':
    test_assessment_api()
