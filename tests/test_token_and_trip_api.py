import httpx
import uuid
from datetime import date

BASE_URL = "http://127.0.0.1:8000"


def get_staff_headers():
    email = f"token_test_{uuid.uuid4()}@iut-dhaka.edu"
    password = "password123"
    signup_payload = {
        "email": email,
        "password": password,
        "full_name": "Token Buyer",
    }
    httpx.post(f"{BASE_URL}/auth/signup", json=signup_payload)
    login_payload = {
        "email": email,
        "password": password,
    }
    resp = httpx.post(f"{BASE_URL}/auth/login", json=login_payload)
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return headers, email


def get_route_and_stop(headers):
    resp = httpx.get(f"{BASE_URL}/routes", headers=headers)
    assert resp.status_code == 200, f"Get routes failed: {resp.status_code} {resp.text}"
    routes = resp.json()
    assert routes, "No routes returned"
    target_route = None
    for r in routes:
        if r.get("route_name") == "Route-1":
            target_route = r
            break
    if target_route is None:
        target_route = routes[0]
    route_id = target_route["id"]
    resp_stops = httpx.get(f"{BASE_URL}/stops/{route_id}/stops", headers=headers)
    assert resp_stops.status_code == 200, f"Get stops failed: {resp_stops.status_code} {resp_stops.text}"
    stops = resp_stops.json()
    assert stops, "No stops returned for route"
    stop_id = stops[0]["id"]
    return route_id, stop_id


def test_token_and_trip_flow():
    headers, email = get_staff_headers()
    resp_me = httpx.get(f"{BASE_URL}/auth/me", headers=headers)
    assert resp_me.status_code == 200, f"/auth/me failed: {resp_me.status_code} {resp_me.text}"
    print("Current user:", resp_me.json())
    resp_trips = httpx.get(f"{BASE_URL}/trips/availability", headers=headers)
    assert resp_trips.status_code == 200, f"/trips/availability failed: {resp_trips.status_code} {resp_trips.text}"
    trips = resp_trips.json()
    assert trips, "No trips returned from /trips/availability"
    print("Trips count:", len(trips))
    route_id, stop_id = get_route_and_stop(headers)
    today = date.today().isoformat()
    payload = {
        "route_id": route_id,
        "pickup_stop_id": stop_id,
        "consumer_email": email,
        "travel_date": today,
        "direction": "TO_IUT",
        "payment_method": "BKASH",
    }
    print("Attempting to buy token...")
    resp_buy = httpx.post(f"{BASE_URL}/token/buy", headers=headers, json=payload)
    print("Status Code:", resp_buy.status_code)
    try:
        print("Response:", resp_buy.json())
    except Exception:
        print("Response text:", resp_buy.text)
    assert resp_buy.status_code == 200, f"Token buy failed: {resp_buy.status_code} {resp_buy.text}"
    payment_data = resp_buy.json()
    payment_id = payment_data["id"]
    
    print(f"Payment initiated: {payment_id}. Confirming...")
    confirm_payload = {
        "external_txn_id": "TEST_TXN_TOKEN_123",
        "status": "SUCCESS"
    }
    resp_confirm = httpx.post(f"{BASE_URL}/payments/{payment_id}/confirm", headers=headers, json=confirm_payload)
    assert resp_confirm.status_code == 200, f"Payment confirm failed: {resp_confirm.status_code} {resp_confirm.text}"
    confirmed_payment = resp_confirm.json()
    token_id = confirmed_payment.get("reference_id")
    
    resp_my = httpx.get(f"{BASE_URL}/token/my-tokens", headers=headers)
    assert resp_my.status_code == 200, f"/token/my-tokens failed: {resp_my.status_code} {resp_my.text}"
    tokens = resp_my.json()
    
    found = any(str(t["id"]) == str(token_id) for t in tokens)
    assert found, f"Created token {token_id} not found in /token/my-tokens: {tokens}"
    print("✅ Token and trip flow test passed")


if __name__ == "__main__":
    test_token_and_trip_flow()

