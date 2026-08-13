#!/usr/bin/env python3
"""
Create sample data for testing code assessment feature
"""

import os
import sys
import django
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django.setup()

from core.models import User, CodingChallenge, TestCase, Result
from core.judge.runner import ExecutionStatus

def create_sample_data():
    """Create sample challenge and user for testing"""
    
    # Create a test user if not exists
    user, created = User.objects.get_or_create(
        user_name='testuser',
        defaults={
            'password': 'pbkdf2_sha256$600000$test$hash',  # Simple hash for testing
            'score': 0,
            'is_active': True,
            'is_staff': False,
            'is_superuser': False
        }
    )
    if created:
        print(f"Created test user: {user.user_name}")
    
    # Create a simple coding challenge
    challenge, created = CodingChallenge.objects.get_or_create(
        challenge_id=1,
        defaults={
            'title': 'Two Sum',
            'description': '''Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].''',
            'difficulty': 'easy',
            'hint': 'Try using a hash map to store the complement of each number.',
            'starter_code': '''def two_sum(nums, target):
    """
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    """
    pass''',
            'score': 100,
            'categories': ['array', 'hash-table'],
            'learning_status': 'active',
            'example_of_correct_code': '''def two_sum(nums, target):
    num_to_index = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_to_index:
            return [num_to_index[complement], i]
        num_to_index[num] = i
    return []''',
            'acceptance_rate': 45.2
        }
    )
    if created:
        print(f"Created challenge: {challenge.title}")
    
    # Create test cases
    test_cases = [
        {'input': [2, 7, 11, 15, 9], 'output': [0, 1], 'is_hidden': False},
        {'input': [3, 2, 4, 6], 'output': [1, 2], 'is_hidden': False},
        {'input': [3, 3, 6], 'output': [0, 1], 'is_hidden': False},
        {'input': [1, 5, 3, 7, 8, 2], 'output': [2, 5], 'is_hidden': True},
        {'input': [0, 4, 3, 0, 4], 'output': [0, 3], 'is_hidden': True},
    ]
    
    for i, tc_data in enumerate(test_cases):
        TestCase.objects.get_or_create(
            challenge=challenge,
            testcase_id=i + 1,
            defaults={
                'input': tc_data['input'],
                'output': tc_data['output'],
                'is_hidden': tc_data['is_hidden']
            }
        )
    
    print(f"Created {len(test_cases)} test cases for challenge")
    
    print("\nSample data created successfully!")
    print(f"Test user: {user.user_name} (ID: {user.user_id})")
    print(f"Challenge: {challenge.title} (ID: {challenge.challenge_id})")
    print("\nTo test the assessment feature:")
    print("1. Submit a 100% AC solution to this challenge")
    print("2. The assessment modal should appear automatically")

if __name__ == '__main__':
    create_sample_data()
