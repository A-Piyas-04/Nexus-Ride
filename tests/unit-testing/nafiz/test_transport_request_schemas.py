# simple tests for transport request schemas

from datetime import date

from app.models.transport_request import RequestStatus
from app.schemas.transport_request import GuestCreate, TransportRequestCreate


def test_request_status():
    assert RequestStatus.PENDING.value == "PENDING"


def test_guest_create():
    guest = GuestCreate(name="Ali", pickup_location="Gate 1")
    assert guest.name == "Ali"


def test_transport_request_create():
    guest = GuestCreate(name="Ali", pickup_location="Gate 1")
    req = TransportRequestCreate(
        event_title="Seminar",
        event_date=date(2026, 10, 1),
        guests=[guest],
    )
    assert req.event_title == "Seminar"
    assert len(req.guests) == 1
