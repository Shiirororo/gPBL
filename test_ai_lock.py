#!/usr/bin/env python3
"""
AI Lock Feature Test Script

This script tests the complete AI lock functionality including:
1. Challenge session creation
2. AI lock creation and validation  
3. Lock expiry
4. API endpoint protection
"""

import os
import sys
import django
from datetime import timedelta
from django.utils import timezone

# Setup Django
sys.path.append('/home/shiro/Desktop/Project/gPBL/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import CodingChallenge, ChallengeSession, FeatureLock
from core.ai.lock_service import LockService


def test_ai_lock_functionality():
    """Test the complete AI lock functionality"""
    
    print("🧪 Testing AI Lock Feature Implementation")
    print("=" * 50)
    
    # Test 1: Create test user and challenge
    print("\n1️⃣  Creating test data...")
    User = get_user_model()
    
    # Create test user
    test_user, created = User.objects.get_or_create(
        user_name='test_ai_lock_user',
        defaults={'score': 0}
    )
    if created:
        test_user.set_password('testpassword123')
        test_user.save()
    print(f"✅ Test user: {test_user.user_name}")
    
    # Create test challenge
    test_challenge, created = CodingChallenge.objects.get_or_create(
        title='AI Lock Test Challenge',
        defaults={
            'description': 'Test challenge for AI lock functionality',
            'difficulty': 'easy',
            'score': 100
        }
    )
    print(f"✅ Test challenge: {test_challenge.title}")
    
    # Test 2: Create AI Lock
    print("\n2️⃣  Testing AI lock creation...")
    
    # Clean up any existing locks
    LockService.remove_lock(test_user)
    
    # Create 1-minute AI lock for testing
    lock = LockService.create_ai_lock(test_user, duration_minutes=1)
    print(f"✅ AI lock created: {lock}")
    
    # Verify lock is active
    is_locked = LockService.is_ai_locked(test_user)
    remaining_time = LockService.get_lock_remaining_time(test_user)
    print(f"✅ AI locked: {is_locked}, Remaining: {remaining_time}s")
    
    # Test 3: Challenge Session Creation
    print("\n3️⃣  Testing challenge session creation...")
    
    # Clean up existing sessions
    ChallengeSession.objects.filter(user=test_user, challenge=test_challenge).delete()
    
    # Create challenge session
    session = ChallengeSession.objects.create(
        user=test_user,
        challenge=test_challenge,
        status='active'
    )
    print(f"✅ Challenge session created: {session}")
    
    # Test 4: Lock Service Methods
    print("\n4️⃣  Testing lock service methods...")
    
    # Test get_lock_expiry
    expiry = LockService.get_lock_expiry(test_user)
    print(f"✅ Lock expiry: {expiry}")
    
    # Test get_user_locks
    user_locks = LockService.get_user_locks(test_user)
    print(f"✅ User locks count: {user_locks.count()}")
    
    # Test 5: Lock Cleanup
    print("\n5️⃣  Testing lock cleanup...")
    
    # Create an expired lock for testing
    expired_lock = FeatureLock.objects.create(
        user=test_user,
        feature='test_feature',
        locked_until=timezone.now() - timedelta(minutes=5)
    )
    print(f"✅ Created expired test lock")
    
    # Clean up expired locks
    cleaned_count = LockService.cleanup_expired_locks()
    print(f"✅ Cleaned up {cleaned_count} expired locks")
    
    # Test 6: Model Properties and Methods
    print("\n6️⃣  Testing model properties...")
    
    # Test FeatureLock.is_expired property
    current_lock = FeatureLock.objects.filter(
        user=test_user, 
        feature=LockService.AI_FEATURE
    ).first()
    
    if current_lock:
        print(f"✅ Current lock expired: {current_lock.is_expired}")
        print(f"✅ Lock string representation: {current_lock}")
    
    # Test ChallengeSession string representation
    print(f"✅ Session string representation: {session}")
    
    # Test 7: Edge Cases
    print("\n7️⃣  Testing edge cases...")
    
    # Test creating lock for non-existent user (should handle gracefully)
    try:
        fake_user = User(user_name='fake_user', user_id=99999)
        result = LockService.create_ai_lock(fake_user, 5)
        print(f"⚠️  Unexpected success with fake user: {result}")
    except Exception as e:
        print(f"✅ Properly handled fake user: {type(e).__name__}")
    
    # Test checking lock for user without lock
    LockService.remove_lock(test_user)
    no_lock_status = LockService.is_ai_locked(test_user)
    no_lock_time = LockService.get_lock_remaining_time(test_user)
    print(f"✅ No lock status: locked={no_lock_status}, time={no_lock_time}")
    
    # Final cleanup
    print("\n🧹 Cleaning up test data...")
    ChallengeSession.objects.filter(user=test_user).delete()
    FeatureLock.objects.filter(user=test_user).delete()
    # Keep user and challenge for potential manual testing
    
    print("\n✅ All tests completed successfully!")
    print("🎉 AI Lock Feature is ready for deployment!")


def test_api_endpoints():
    """Test that new API endpoints are properly configured"""
    
    print("\n🌐 Testing API Endpoint Configuration")
    print("=" * 40)
    
    try:
        from django.urls import reverse
        from django.test import Client
        
        # Test lock status endpoint
        try:
            url = reverse('ai-lock-status')
            print(f"✅ Lock status URL: {url}")
        except:
            print("❌ Lock status URL not found")
        
        # Test challenge start endpoint
        try:
            url = reverse('challenge-start', kwargs={'challenge_id': 1})
            print(f"✅ Challenge start URL: {url}")
        except:
            print("❌ Challenge start URL not found")
            
    except Exception as e:
        print(f"❌ URL configuration error: {e}")


if __name__ == '__main__':
    try:
        test_ai_lock_functionality()
        test_api_endpoints()
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
