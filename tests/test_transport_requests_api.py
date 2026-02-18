import httpx
from datetime import date

BASE_URL = "http://127.0.0.1:8000"
TO_EMAIL = "transportofficer@iut-dhaka.edu"
TO_PASSWORD = "transportofficer@iut-dhaka.edu"
FACULTY_EMAILS = [
    "faculty1@iut-dhaka.edu",
    "faculty2@iut-dhaka.edu",
    "ahnaf.shahriar@iut-dhaka.edu",
]


def get_faculty_headers():
    password = "password123"
    for email in FACULTY_EMAILS:
        login_payload = {
            "email": email,
            "password": password,
        }
        resp_login = httpx.post(f"{BASE_URL}/auth/login", json=login_payload)
        if resp_login.status_code == 200:
            token = resp_login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            return headers
        signup_payload = {
            "email": email,
            "password": password,
            "full_name": "Faculty User",
        }
        resp_signup = httpx.post(f"{BASE_URL}/auth/signup", json=signup_payload)
        print("Faculty signup status:", resp_signup.status_code, "for", email)
        print("Faculty signup response:", resp_signup.text)
        resp_login = httpx.post(f"{BASE_URL}/auth/login", json=login_payload)
        if resp_login.status_code == 200:
            token = resp_login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            return headers
        print("Faculty login failed for", email, "status:", resp_login.status_code, "response:", resp_login.text)
    raise AssertionError("Unable to obtain faculty auth token with any allowed email")


def get_to_headers():
    login_payload = {
        "email": TO_EMAIL,
        "password": TO_PASSWORD,
    }
    resp_login = httpx.post(f"{BASE_URL}/auth/login", json=login_payload)
    assert resp_login.status_code == 200, f"TO login failed: {resp_login.status_code} {resp_login.text}"
    token = resp_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return headers


def test_transport_requests_flow():
    faculty_headers = get_faculty_headers()
    body = {
        "event_title": "Test Guest Lecture",
        "event_date": date.today().isoformat(),
        "guests": [
            {"name": "Guest A", "pickup_location": "Airport"},
            {"name": "Guest B", "pickup_location": "Hotel"},
        ],
    }
    resp_create = httpx.post(f"{BASE_URL}/transport-requests", headers=faculty_headers, json=body)
    print("Create status:", resp_create.status_code)
    print("Create response:", resp_create.text)
    assert resp_create.status_code == 200, f"Create transport request failed: {resp_create.status_code} {resp_create.text}"
    created = resp_create.json()
    request_id = created["id"]
    resp_my = httpx.get(f"{BASE_URL}/transport-requests/my", headers=faculty_headers)
    assert resp_my.status_code == 200, f"/transport-requests/my failed: {resp_my.status_code} {resp_my.text}"
    my_requests = resp_my.json()
    assert any(r["id"] == request_id for r in my_requests), "Created request not found in /transport-requests/my"
    resp_get = httpx.get(f"{BASE_URL}/transport-requests/by-id/{request_id}", headers=faculty_headers)
    assert resp_get.status_code == 200, f"Get request by id failed: {resp_get.status_code} {resp_get.text}"
    to_headers = get_to_headers()
    resp_list = httpx.get(f"{BASE_URL}/transport-requests", headers=to_headers)
    assert resp_list.status_code == 200, f"TO list requests failed: {resp_list.status_code} {resp_list.text}"
    all_requests = resp_list.json()
    assert any(r["id"] == request_id for r in all_requests), "Created request not visible to TO in list"
    status_payload = {
        "status": "APPROVED",
        "note": "Approved in automated test",
    }
    resp_status = httpx.patch(f"{BASE_URL}/transport-requests/{request_id}/status", headers=to_headers, json=status_payload)
    print("Status update:", resp_status.status_code, resp_status.text)
    assert resp_status.status_code == 200, f"Update status failed: {resp_status.status_code} {resp_status.text}"
    updated = resp_status.json()
    assert updated.get("status") == "APPROVED", "Status not updated to APPROVED"
    resp_vehicles = httpx.get(f"{BASE_URL}/transport-requests/vehicles", headers=to_headers)
    assert resp_vehicles.status_code == 200, f"/transport-requests/vehicles failed: {resp_vehicles.status_code} {resp_vehicles.text}"
    vehicles = resp_vehicles.json()
    assert vehicles, "No vehicles returned for assignment"
    vehicle_id = vehicles[0]["id"]
    resp_drivers = httpx.get(f"{BASE_URL}/transport-requests/drivers", headers=to_headers)
    assert resp_drivers.status_code == 200, f"/transport-requests/drivers failed: {resp_drivers.status_code} {resp_drivers.text}"
    drivers = resp_drivers.json()
    assert drivers, "No drivers returned for assignment"
    driver_id = drivers[0]["id"]
    assign_payload = {
        "assigned_vehicle_id": vehicle_id,
        "assigned_driver_profile_id": driver_id,
        "to_reply_message": "Assigned in automated test",
    }
    resp_assign = httpx.patch(f"{BASE_URL}/transport-requests/{request_id}/assign", headers=to_headers, json=assign_payload)
    print("Assign status:", resp_assign.status_code)
    print("Assign response:", resp_assign.text)
    assert resp_assign.status_code == 200, f"Assign request failed: {resp_assign.status_code} {resp_assign.text}"
    assigned = resp_assign.json()
    assert assigned.get("status") == "ASSIGNED", "Status not updated to ASSIGNED"
    assert assigned.get("assigned_vehicle_id") == vehicle_id, "Vehicle not assigned correctly"
    assert assigned.get("assigned_driver_profile_id") == driver_id, "Driver not assigned correctly"
    print("✅ Transport requests API flow test passed")


if __name__ == "__main__":
    test_transport_requests_flow()
