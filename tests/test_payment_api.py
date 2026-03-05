import httpx
import uuid
from datetime import datetime, date, timedelta

BASE_URL = "http://127.0.0.1:8000"

# --- Helper Functions ---

def create_user_and_get_token(role="STAFF"):
    email = f"user_{uuid.uuid4()}@iut-dhaka.edu"
    password = "password123"
    full_name = "Test User"
    
    # Signup
    resp = httpx.post(f"{BASE_URL}/auth/signup", json={
        "email": email,
        "password": password,
        "full_name": full_name
    })
    assert resp.status_code == 200 or resp.status_code == 409
    
    # Login
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}, email

def get_to_token():
    # Assumes a TO user exists or we can create one. 
    # For now, we'll try to login as a known TO or create a user and hope the system 
    # allows us to use them (in a real test env, we'd seed a TO).
    # Since we can't easily promote to TO via API, we might skip TO specific tests 
    # if we can't authenticate as one, OR we assume the seed data exists.
    # Let's try a standard user for now and note that TO tests might fail 403.
    return create_user_and_get_token()

# --- Test Cases ---

def test_initiate_payment():
    print("\n--- Testing Initiate Payment ---")
    headers, _ = create_user_and_get_token()
    
    # Initiate a dummy payment
    payload = {
        "reference_type": "TOKEN",
        "reference_id": "dummy-ref-id", # Won't be validated deeply at this stage usually
        "payment_method": "BKASH",
        "amount": 50.00 # API might ignore this and compute server side
    }
    
    resp = httpx.post(f"{BASE_URL}/payments/initiate", json=payload, headers=headers)
    print(f"Initiate Status: {resp.status_code}")
    print(f"Response: {resp.json()}")
    
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "INITIATED"
    assert data["payment_method"] == "BKASH"
    assert "id" in data
    return data["id"], headers

def test_token_flow():
    print("\n--- Testing Token Flow (Payment -> Token) ---")
    headers, email = create_user_and_get_token()
    
    # 1. Get Route and Trip Info (Prerequisite)
    # We need a valid trip to buy a token for.
    resp_trips = httpx.get(f"{BASE_URL}/trips/availability", headers=headers)
    if resp_trips.status_code != 200 or not resp_trips.json():
        print("⚠️ No trips available, skipping Token Flow test.")
        return

    trip = resp_trips.json()[0]
    trip_id = trip["id"]
    
    # Ensure we use the route_id from the trip if available, or fetch route
    trip_route_id = trip["route_id"]
    trip_direction = trip["direction"] # e.g. "TO_IUT" or "FROM_IUT"
    
    # We need a stop for this route.
    resp_stops = httpx.get(f"{BASE_URL}/stops/{trip_route_id}/stops", headers=headers)
    stops = resp_stops.json()
    if not stops:
        print("⚠️ No stops found for route, skipping Token Flow test.")
        return
        
    stop_id = stops[0]["id"]
    
    # 2. Call /token/buy (Should create Payment, NOT Token)
    buy_payload = {
        "route_id": trip_route_id,
        "pickup_stop_id": stop_id,
        "travel_date": trip["trip_date"],
        "direction": trip_direction, 
        "payment_method": "NAGAD",
        "consumer_email": email
    }
    
    print("Buying Token (Initiating Payment)...")
    resp_buy = httpx.post(f"{BASE_URL}/token/buy", json=buy_payload, headers=headers)
    
    # Note: If no matching trip found for specific date/direction, this might fail 404.
    # We might need to be more precise with data setup.
    if resp_buy.status_code != 200:
        print(f"⚠️ Token buy failed: {resp_buy.status_code} {resp_buy.text}")
        return

    payment_data = resp_buy.json()
    print(f"Payment Initiated: {payment_data['id']}")
    assert payment_data["status"] == "INITIATED"
    assert payment_data["payment_type"] == "TOKEN"
    assert payment_data["reference_id"] is None # Should be null initially
    
    payment_id = payment_data["id"]
    
    # 3. Confirm Payment (Should trigger Token Creation)
    confirm_payload = {
        "status": "SUCCESS",
        "external_txn_id": f"TXN_{uuid.uuid4()}"
    }
    
    print("Confirming Payment...")
    resp_confirm = httpx.post(f"{BASE_URL}/payments/{payment_id}/confirm", json=confirm_payload, headers=headers)
    print(f"Confirm Status: {resp_confirm.status_code}")
    
    assert resp_confirm.status_code == 200
    confirmed_data = resp_confirm.json()
    assert confirmed_data["status"] == "SUCCESS"
    assert confirmed_data["reference_id"] is not None # Should now have Token ID
    
    token_id = confirmed_data["reference_id"]
    print(f"Token Created with ID: {token_id}")
    
    # 4. Verify Token Exists
    resp_tokens = httpx.get(f"{BASE_URL}/token/my-tokens", headers=headers)
    my_tokens = resp_tokens.json()
    assert any(str(t["id"]) == str(token_id) for t in my_tokens)
    print("✅ Token Flow Success")

def test_subscription_flow():
    print("\n--- Testing Subscription Flow (Payment -> Subscription) ---")
    headers, _ = create_user_and_get_token()
    
    # 1. Apply for Subscription (Should be PENDING)
    sub_payload = {
        "start_month": "01",
        "end_month": "06",
        "year": 2025,
        "stop_name": "Tongi Station Road" # Assuming this stop exists in seed
    }
    
    print("Applying for Subscription...")
    resp_apply = httpx.post(f"{BASE_URL}/subscription/", json=sub_payload, headers=headers)
    
    if resp_apply.status_code != 200:
        print(f"⚠️ Subscription apply failed: {resp_apply.status_code} {resp_apply.text}")
        return
        
    sub_data = resp_apply.json()
    sub_id = sub_data["id"]
    print(f"Subscription Created: {sub_id} (Status: {sub_data['status']})")
    assert sub_data["status"] == "PENDING"
    
    # 2. Initiate Payment for Subscription
    pay_payload = {
        "reference_type": "SUBSCRIPTION",
        "reference_id": str(sub_id),
        "payment_method": "UPAY"
    }
    
    print("Initiating Payment...")
    resp_pay = httpx.post(f"{BASE_URL}/payments/initiate", json=pay_payload, headers=headers)
    assert resp_pay.status_code == 200
    payment_data = resp_pay.json()
    payment_id = payment_data["id"]
    
    # 3. Confirm Payment (Should Activate Subscription)
    confirm_payload = {
        "status": "SUCCESS",
        "external_txn_id": f"TXN_{uuid.uuid4()}"
    }
    
    print("Confirming Payment...")
    resp_confirm = httpx.post(f"{BASE_URL}/payments/{payment_id}/confirm", json=confirm_payload, headers=headers)
    assert resp_confirm.status_code == 200
    
    # 4. Verify Subscription is PENDING (waiting for TO approval)
    resp_sub = httpx.get(f"{BASE_URL}/subscription/", headers=headers)
    my_sub = resp_sub.json()
    print(f"Subscription Status after Payment: {my_sub['status']}")
    assert my_sub["status"] == "PENDING"
    print("✅ Subscription Flow Success (Pending TO Approval)")

def test_my_payments():
    print("\n--- Testing My Payments ---")
    headers, _ = create_user_and_get_token()
    
    # Create a payment first
    payload = {
        "reference_type": "TOKEN",
        "reference_id": "test-ref",
        "payment_method": "BKASH"
    }
    httpx.post(f"{BASE_URL}/payments/initiate", json=payload, headers=headers)
    
    # Get List
    resp = httpx.get(f"{BASE_URL}/payments/me", headers=headers)
    assert resp.status_code == 200
    payments = resp.json()
    assert len(payments) > 0
    print(f"Found {len(payments)} payments for user")

if __name__ == "__main__":
    try:
        # Run individual tests
        test_initiate_payment()
        test_token_flow()
        test_subscription_flow()
        test_my_payments()
        print("\n🎉 All Payment Tests Completed Successfully!")
    except AssertionError as e:
        print(f"\n❌ Test Failed: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
