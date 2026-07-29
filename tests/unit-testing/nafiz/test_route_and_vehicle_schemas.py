# simple tests for route and vehicle schemas

from app.schemas.route import RouteCreate, RouteStopCreate
from app.schemas.vehicle import VehicleCreate


def test_route_create():
    route = RouteCreate(route_name="Route A")
    assert route.route_name == "Route A"
    assert route.is_active == True


def test_stop_create():
    stop = RouteStopCreate(stop_name="Stop 1", sequence_number=1)
    assert stop.stop_name == "Stop 1"


def test_vehicle_create():
    vehicle = VehicleCreate(
        vehicle_number="DHAKA-123",
        capacity=40,
        status="ACTIVE",
    )
    assert vehicle.capacity == 40
