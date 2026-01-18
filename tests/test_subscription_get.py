import httpx
import uuid

BASE_URL = "http://127.0.0.1:8000"

def get_auth_token_with_subscription():
    # Helper to get a valid token and ensure subscription exists
    email = f"test_{uuid.uuid4()}@example.com"
    httpx.post(f"{BASE_URL}/auth/signup", json={
        "email": email,
        "password": "password123",
        "full_name": "Test User"
    })
    login_res = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": "password123"
    })
    token = login_res.json()["access_token"]

    body = {
        "start_month": "01",
        "end_month": "01",
        "year": 2025,
        "stop_name": "Main Street Stop",
    }

    httpx.post(f"{BASE_URL}/subscription/", headers={"Authorization": f"Bearer {token}"}, json=body)
    return token

def test_subscription_get():
    try:
        token = get_auth_token_with_subscription()
        headers = {"Authorization": f"Bearer {token}"}
        
        print("Attempting to get subscription...")
        response = httpx.get(f"{BASE_URL}/subscription/", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "status" in data:
                print("✅ Subscription GET Test Passed")
            else:
                print("❌ Response missing status field")
        else:
            print("❌ Subscription GET Test Failed")

    except Exception as e:
        print(f"❌ Error during request: {str(e)}")

if __name__ == "__main__":
    test_subscription_get()
