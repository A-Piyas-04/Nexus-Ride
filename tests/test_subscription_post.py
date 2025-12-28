import httpx
import uuid

BASE_URL = "http://127.0.0.1:8001"

def get_auth_token():
    # Helper to get a valid token
    email = f"test_{uuid.uuid4()}@example.com"
    httpx.post(f"{BASE_URL}/auth/signup", json={
        "email": email,
        "password": "password123",
        "full_name": "Test User"
    })
    response = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": "password123"
    })
    return response.json()["access_token"]

def test_subscription_post():
    try:
        token = get_auth_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        print("Attempting to create subscription...")
        response = httpx.post(f"{BASE_URL}/subscription/", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data["status"] == "PENDING":
                print("✅ Subscription POST Test Passed")
            else:
                print(f"❌ Unexpected status: {data.get('status')}")
        elif response.status_code == 400:
             print("⚠️ Subscription already exists (Test run on existing user?)")
        else:
            print("❌ Subscription POST Test Failed")

    except Exception as e:
        print(f"❌ Error during request: {str(e)}")

if __name__ == "__main__":
    test_subscription_post()
