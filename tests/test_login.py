import httpx
import uuid

BASE_URL = "http://127.0.0.1:8001"

def test_login():
    # First ensure we have a user to login with
    email = f"test_{uuid.uuid4()}@example.com"
    signup_payload = {
        "email": email,
        "password": "password123",
        "full_name": "Test User"
    }
    httpx.post(f"{BASE_URL}/auth/signup", json=signup_payload)
    
    # Now try login
    login_payload = {
        "email": email,
        "password": "password123"
    }
    
    print(f"Attempting login for: {email}")
    try:
        response = httpx.post(f"{BASE_URL}/auth/login", json=login_payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 and "access_token" in response.json():
            print("✅ Login Test Passed")
            print(f"Token: {response.json()['access_token'][:20]}...")
        else:
            print("❌ Login Test Failed")
            
    except Exception as e:
        print(f"❌ Error during request: {str(e)}")

if __name__ == "__main__":
    test_login()
