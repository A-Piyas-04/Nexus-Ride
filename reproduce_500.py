import httpx
import sys
import uuid
from datetime import date, time

BASE_URL = "http://127.0.0.1:8000"

def reproduce_500():
    # 1. Setup Driver
    digits = "".join(ch for ch in uuid.uuid4().hex if ch.isdigit())
    if len(digits) < 8: digits = (digits + "12345678")[:8]
    driver_mobile = "017" + digits[:8]
    password = "password123"
    
    print(f"Creating driver: {driver_mobile}")
    httpx.post(f"{BASE_URL}/drivers/signup", json={
        "full_name": "Test Driver",
        "mobile_number": driver_mobile,
        "password": password,
        "license_number": f"DL-{digits[:4]}",
    })
    
    resp_login_driver = httpx.post(f"{BASE_URL}/drivers/login", json={
        "mobile_number": driver_mobile,
        "password": password,
    })
    driver_token = resp_login_driver.json()["access_token"]
    driver_headers = {"Authorization": f"Bearer {driver_token}"}
    
    # Get Driver ID
    resp_me = httpx.get(f"{BASE_URL}/drivers/me", headers=driver_headers)
    driver_id = resp_me.json()["id"]
    print(f"Driver ID: {driver_id}")

    # 2. Setup TO and Create Trip
    # Try seeded TO first with correct credentials
    to_token = None
    to_headers = None
    
    print("Trying seeded TO login with correct password...")
    resp_login_seed = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "transportofficer@iut-dhaka.edu",
        "password": "transportofficer@iut-dhaka.edu"
    })
    
    if resp_login_seed.status_code == 200:
        print("Using seeded TO account.")
        to_token = resp_login_seed.json()["access_token"]
        to_headers = {"Authorization": f"Bearer {to_token}"}
    else:
        print(f"Seeded TO login failed: {resp_login_seed.status_code}. Cannot create trip.")
        return

    # Create Route (if needed)
    # Check existing routes
    resp_routes = httpx.get(f"{BASE_URL}/routes", headers=to_headers)
    if resp_routes.json():
        route_id = resp_routes.json()[0]["id"]
    else:
        print("Creating Route...")
        resp_route = httpx.post(f"{BASE_URL}/routes", headers=to_headers, json={
            "route_name": f"Route-{digits[:4]}",
            "is_active": True,
            "stops": [{"stop_name": "Stop A", "sequence_number": 1}]
        })
        if resp_route.status_code != 200:
            print(f"Route creation failed: {resp_route.text}")
            return
        route_id = resp_route.json()["id"]

    # Create Vehicle
    print("Creating Vehicle...")
    resp_vehicle = httpx.post(f"{BASE_URL}/vehicles", headers=to_headers, json={
        "vehicle_number": f"V-{digits[:4]}",
        "capacity": 30
    })
    if resp_vehicle.status_code != 201:
        # Maybe exists
        resp_vehicles = httpx.get(f"{BASE_URL}/vehicles", headers=to_headers)
        vehicle_id = resp_vehicles.json()[0]["id"]
    else:
        vehicle_id = resp_vehicle.json()["id"]

    # Create Trip
    print("Creating Trip...")
    trip_payload = {
        "vehicle_id": vehicle_id,
        "driver_profile_id": driver_id,
        "route_id": route_id,
        "direction": "FROM_IUT",
        "trip_date": date.today().isoformat(),
        "start_time": "08:00:00"
    }
    resp_trip = httpx.post(f"{BASE_URL}/trips/", headers=to_headers, json=trip_payload)
    if resp_trip.status_code != 200:
        print(f"Trip creation failed: {resp_trip.status_code} {resp_trip.text}")
        return
    print("Trip created.")

    # 3. Fetch My Trips as Driver
    print("Calling GET /drivers/my-trips...")
    resp = httpx.get(f"{BASE_URL}/drivers/my-trips", headers=driver_headers)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")

if __name__ == "__main__":
    reproduce_500()
