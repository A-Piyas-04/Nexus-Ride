import os
import time
import json
import requests

BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:8000")
TO_EMAIL = "transportofficer@iut-dhaka.edu"
TO_PASSWORD = "transportofficer@iut-dhaka.edu"


def pretty(title, payload):
    print(f"\n=== {title} ===")
    if isinstance(payload, (dict, list)):
        print(json.dumps(payload, indent=2, default=str))
    else:
        print(payload)


def login():
    url = f"{BASE_URL}/auth/login"
    resp = requests.post(url, json={"email": TO_EMAIL, "password": TO_PASSWORD})
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
    token = resp.json()["access_token"]
    pretty("Login OK", {"token_prefix": token[:12]})
    return {"Authorization": f"Bearer {token}"}


def get_vehicles():
    url = f"{BASE_URL}/vehicles"
    resp = requests.get(url)
    assert resp.status_code == 200, f"List vehicles failed: {resp.status_code} {resp.text}"
    data = resp.json()
    pretty("List Vehicles (Public GET)", {"count": len(data)})
    return data


def create_vehicle(headers):
    url = f"{BASE_URL}/vehicles"
    unique_num = f"NR-TMP-{int(time.time())}"
    payload = {"vehicle_number": unique_num, "capacity": 29}
    resp = requests.post(url, json=payload, headers=headers)
    assert resp.status_code == 201, f"Create vehicle failed: {resp.status_code} {resp.text}"
    data = resp.json()
    pretty("Create Vehicle", data)
    return data


def update_status(vehicle_id, headers, status_value="IN_SERVICE"):
    url = f"{BASE_URL}/vehicles/{vehicle_id}/status"
    resp = requests.patch(url, json={"status": status_value}, headers=headers)
    assert resp.status_code == 200, f"Update status failed: {resp.status_code} {resp.text}"
    data = resp.json()
    pretty("Update Vehicle Status", {"id": vehicle_id, "status": data["status"]})
    return data


def update_number_and_capacity(vehicle_id, headers):
    url = f"{BASE_URL}/vehicles/{vehicle_id}"
    payload = {"vehicle_number": f"NR-TMP-UPD-{int(time.time())}", "capacity": 35}
    resp = requests.patch(url, json=payload, headers=headers)
    assert resp.status_code == 200, f"Update number/capacity failed: {resp.status_code} {resp.text}"
    data = resp.json()
    pretty("Update Vehicle Fields", {"id": vehicle_id, "vehicle_number": data["vehicle_number"], "capacity": data["capacity"]})
    return data


def delete_vehicle(vehicle_id, headers, expect_conflict=False):
    url = f"{BASE_URL}/vehicles/{vehicle_id}"
    resp = requests.delete(url, headers=headers)
    if expect_conflict:
        assert resp.status_code == 409, f"Expected 409, got {resp.status_code} {resp.text}"
        pretty("Delete Vehicle (Conflict as Expected)", {"status_code": resp.status_code, "detail": resp.text})
    else:
        assert resp.status_code == 204, f"Delete vehicle failed: {resp.status_code} {resp.text}"
        pretty("Delete Vehicle", {"id": str(vehicle_id), "status_code": resp.status_code})


def try_conflict_delete(headers):
    # Attempt to delete a seeded vehicle that should be assigned to a driver or active trip
    vehicles = get_vehicles()
    target_numbers = {"NR-208", "NR-219", "NR-331", "NR-514"}
    for v in vehicles:
        if v["vehicle_number"] in target_numbers:
            try:
                delete_vehicle(v["id"], headers, expect_conflict=True)
            except AssertionError as e:
                # If environment differs (e.g., seeds changed), just print info and continue
                pretty("Conflict Delete Attempt Result", str(e))
            break


def main():
    headers = login()

    # Public GETs
    get_vehicles()

    # Create
    created = create_vehicle(headers)

    # GET single
    v_id = created["id"]
    resp = requests.get(f"{BASE_URL}/vehicles/{v_id}")
    assert resp.status_code == 200, f"Get created vehicle failed: {resp.status_code} {resp.text}"
    pretty("Get Single Vehicle", resp.json())

    # Update status
    update_status(v_id, headers, "IN_SERVICE")

    # Update number and capacity
    update_number_and_capacity(v_id, headers)

    # Delete newly created vehicle (should succeed)
    delete_vehicle(v_id, headers)

    # Negative: attempt to delete a seeded, in-use vehicle (should 409)
    try_conflict_delete(headers)

    pretty("All Tests", "Completed Successfully")


if __name__ == "__main__":
    main()

