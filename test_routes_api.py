import requests
import sys

BASE_URL = "http://localhost:8000"
TO_EMAIL = "transportofficer@iut-dhaka.edu"
TO_PASSWORD = "transportofficer@iut-dhaka.edu"

def test_routes():
    print("--- Starting Route API Tests ---")
    
    # 1. Login as Transport Officer
    print("\n1. Logging in as Transport Officer...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": TO_EMAIL,
        "password": TO_PASSWORD
    })
    if login_res.status_code != 200:
        print(f"FAILED: Login failed with status {login_res.status_code}")
        print(login_res.text)
        return
    
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("SUCCESS: Logged in.")

    # 2. Get existing routes
    print("\n2. Getting existing routes...")
    get_res = requests.get(f"{BASE_URL}/routes")
    if get_res.status_code == 200:
        routes = get_res.json()
        print(f"SUCCESS: Found {len(routes)} routes.")
    else:
        print(f"FAILED: Could not fetch routes. Status {get_res.status_code}")
        print(get_res.text)

    # 3. Create a new route
    print("\n3. Creating a new route (Route-Test)...")
    new_route_data = {
        "route_name": "Route-Test",
        "is_active": True,
        "stops": [
            {"stop_name": "Test Stop 1", "sequence_number": 1},
            {"stop_name": "Test Stop 2", "sequence_number": 2}
        ]
    }
    create_res = requests.post(f"{BASE_URL}/routes", json=new_route_data, headers=headers)
    if create_res.status_code == 200:
        route_id = create_res.json()["id"]
        print(f"SUCCESS: Route created with ID: {route_id}")
    elif create_res.status_code == 400 and "already exists" in create_res.text:
        print("INFO: Route already exists from previous test run.")
        # Try to get the ID from the list
        routes = requests.get(f"{BASE_URL}/routes").json()
        route_id = next(r["id"] for r in routes if r["route_name"] == "Route-Test")
    else:
        print(f"FAILED: Could not create route. Status {create_res.status_code}")
        print(create_res.text)
        return

    # 4. Add a stop to the route
    print("\n4. Adding a stop to Route-Test...")
    new_stop_data = {
        "stop_name": "Test Stop 3",
        "sequence_number": 3
    }
    stop_res = requests.post(f"{BASE_URL}/routes/{route_id}/stops", json=new_stop_data, headers=headers)
    if stop_res.status_code == 200:
        print("SUCCESS: Stop added.")
    elif stop_res.status_code == 400 and "already exists" in stop_res.text:
        print("INFO: Stop already exists.")
    else:
        print(f"FAILED: Could not add stop. Status {stop_res.status_code}")
        print(stop_res.text)

    # 5. Test RBAC (Signup a normal user and try to add a route)
    print("\n5. Testing RBAC with a normal user...")
    test_user = {
        "email": "testuser@iut-dhaka.edu",
        "password": "testpassword",
        "full_name": "Test User"
    }
    # Signup
    requests.post(f"{BASE_URL}/auth/signup", json=test_user)
    # Login
    user_login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    user_token = user_login_res.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Try to create route
    rbac_res = requests.post(f"{BASE_URL}/routes", json=new_route_data, headers=user_headers)
    if rbac_res.status_code == 403:
        print("SUCCESS: RBAC working. Normal user forbidden from adding routes.")
    else:
        print(f"FAILED: RBAC failed. Normal user got status {rbac_res.status_code} instead of 403.")

    print("\n--- Route API Tests Completed ---")

if __name__ == "__main__":
    test_routes()
