import httpx
import uuid

BASE_URL = "http://127.0.0.1:8000"


def test_drivers_flow():
    digits = "".join(ch for ch in uuid.uuid4().hex if ch.isdigit())
    if len(digits) < 8:
        digits = (digits + "12345678")[:8]
    mobile_number = "017" + digits[:8]
    
    # Generate random 4 digits for license
    import random
    license_digits = "".join([str(random.randint(0, 9)) for _ in range(4)])
    license_number = f"DL-{license_digits}"
    
    password = "password123"
    signup_payload = {
        "full_name": "Test Driver",
        "mobile_number": mobile_number,
        "password": password,
        "license_number": license_number,
    }
    resp_signup = httpx.post(f"{BASE_URL}/drivers/signup", json=signup_payload)
    print("Signup status:", resp_signup.status_code)
    print("Signup response:", resp_signup.text)
    assert resp_signup.status_code == 200, f"Driver signup failed: {resp_signup.status_code} {resp_signup.text}"
    login_payload = {
        "mobile_number": mobile_number,
        "password": password,
    }
    resp_login = httpx.post(f"{BASE_URL}/drivers/login", json=login_payload)
    print("Login status:", resp_login.status_code)
    print("Login response:", resp_login.text)
    assert resp_login.status_code == 200, f"Driver login failed: {resp_login.status_code} {resp_login.text}"
    token = resp_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    resp_requests = httpx.get(f"{BASE_URL}/drivers/requests")
    assert resp_requests.status_code == 200, f"/drivers/requests failed: {resp_requests.status_code} {resp_requests.text}"
    requests_list = resp_requests.json()
    assert requests_list, "No driver requests returned"
    driver_request = next((r for r in requests_list if r.get("mobile_number") == mobile_number), None)
    assert driver_request is not None, "Created driver request not found in /drivers/requests"
    driver_id = driver_request["id"]
    resp_approve = httpx.put(f"{BASE_URL}/drivers/{driver_id}/approve")
    print("Approve status:", resp_approve.status_code)
    print("Approve response:", resp_approve.text)
    assert resp_approve.status_code == 200, f"Approve driver failed: {resp_approve.status_code} {resp_approve.text}"
    resp_me = httpx.get(f"{BASE_URL}/drivers/me", headers=headers)
    print("Me status:", resp_me.status_code)
    print("Me response:", resp_me.text)
    assert resp_me.status_code == 200, f"/drivers/me failed: {resp_me.status_code} {resp_me.text}"
    me_data = resp_me.json()
    assert me_data.get("mobile_number") == mobile_number, "Driver mobile_number mismatch in /drivers/me"
    print("✅ Drivers API flow test passed")


if __name__ == "__main__":
    test_drivers_flow()
