#!/usr/bin/env python3
"""
Test AI Lock Feature with Real API Calls

This script tests the AI lock feature using the actual Django server.
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_USER = {
    "user_name": "ai_lock_test_user",
    "password": "testpass123"
}
TEST_CHALLENGE_ID = 1

def test_ai_lock_flow():
    """Test the complete AI lock flow via API calls"""
    
    print("🧪 Testing AI Lock Feature via API")
    print("=" * 50)
    
    session = requests.Session()
    
    # Step 1: Login and get JWT token
    print("\n1️⃣  Logging in...")
    login_response = session.post(f"{BASE_URL}/api/auth/login/", json=TEST_USER)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return False
    
    tokens = login_response.json()
    access_token = tokens.get("access")
    if not access_token:
        print("❌ No access token received")
        return False
    
    print(f"✅ Login successful, token: {access_token[:20]}...")
    
    # Set authorization header for subsequent requests
    session.headers.update({"Authorization": f"Bearer {access_token}"})
    
    # Step 2: Check initial lock status
    print("\n2️⃣  Checking initial lock status...")
    lock_status_response = session.get(f"{BASE_URL}/api/ai/lock-status/")
    
    if lock_status_response.status_code == 200:
        status = lock_status_response.json()
        print(f"✅ Lock status: {status}")
    else:
        print(f"❌ Failed to get lock status: {lock_status_response.status_code}")
        print(f"Response: {lock_status_response.text}")
    
    # Step 3: Start challenge to create AI lock
    print(f"\n3️⃣  Starting challenge {TEST_CHALLENGE_ID}...")
    start_response = session.post(f"{BASE_URL}/api/challenges/challenge/{TEST_CHALLENGE_ID}/start/")
    
    if start_response.status_code == 201:
        result = start_response.json()
        print(f"✅ Challenge started successfully:")
        print(f"   Session ID: {result.get('session_id')}")
        print(f"   AI Locked: {result.get('ai_locked')}")
        print(f"   Locked Until: {result.get('ai_locked_until')}")
        print(f"   Message: {result.get('message')}")
    else:
        print(f"❌ Failed to start challenge: {start_response.status_code}")
        print(f"Response: {start_response.text}")
        return False
    
    # Step 4: Check lock status after starting challenge
    print("\n4️⃣  Checking lock status after starting challenge...")
    lock_status_response = session.get(f"{BASE_URL}/api/ai/lock-status/")
    
    if lock_status_response.status_code == 200:
        status = lock_status_response.json()
        print(f"✅ Lock status after start: {status}")
        
        if status.get("ai_locked"):
            remaining = status.get("remaining_seconds", 0)
            print(f"🔒 AI is locked for {remaining} seconds")
        else:
            print("🔓 AI is not locked (unexpected)")
    else:
        print(f"❌ Failed to get lock status: {lock_status_response.status_code}")
    
    # Step 5: Try to access AI while locked
    print("\n5️⃣  Testing AI access while locked...")
    
    # Try to create AI conversation
    ai_create_response = session.post(f"{BASE_URL}/api/ai/conversations/", json={
        "challenge_id": TEST_CHALLENGE_ID
    })
    
    if ai_create_response.status_code == 423:
        error = ai_create_response.json()
        print(f"✅ AI access properly blocked: {error.get('error', {}).get('message')}")
        remaining = error.get('error', {}).get('remaining_seconds', 0)
        print(f"🔒 {remaining} seconds remaining")
    elif ai_create_response.status_code == 201:
        print("❌ AI access was NOT blocked (this is the bug!)")
        return False
    else:
        print(f"⚠️  Unexpected response: {ai_create_response.status_code}")
        print(f"Response: {ai_create_response.text}")
    
    # Step 6: Test lock status polling
    print("\n6️⃣  Testing lock countdown...")
    for i in range(3):
        lock_response = session.get(f"{BASE_URL}/api/ai/lock-status/")
        if lock_response.status_code == 200:
            status = lock_response.json()
            remaining = status.get("remaining_seconds", 0)
            print(f"   Countdown {i+1}: {remaining}s remaining")
        time.sleep(2)
    
    print("\n✅ AI Lock Feature test completed!")
    return True

if __name__ == "__main__":
    try:
        success = test_ai_lock_flow()
        if success:
            print("\n🎉 All tests passed! AI lock feature is working correctly.")
        else:
            print("\n❌ Some tests failed. Please check the implementation.")
    except Exception as e:
        print(f"\n💥 Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
