import httpx
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_signup():
    email = f"pias_{uuid.uuid4()}@iut-dhaka.edu"
    payload = {
        "email": email,
        "password": "password123",
        "full_name": "Test User"
    }
    
    print(f"Attempting signup with email: {email}")
    try:
        response = httpx.post(f"{BASE_URL}/auth/signup", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Signup Test Passed")
        else:
            print("❌ Signup Test Failed")
            
    except Exception as e:
        print(f"❌ Error during request: {str(e)}")

if __name__ == "__main__":
    test_signup()
