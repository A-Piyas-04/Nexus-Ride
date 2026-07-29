# simple tests for token schema

from datetime import date
from uuid import uuid4

from app.models.payment import PaymentMethod
from app.schemas.token import TokenCreate


def test_token_create():
    data = TokenCreate(
        route_id=uuid4(),
        pickup_stop_id=uuid4(),
        travel_date=date(2026, 8, 1),
        direction="UP",
        payment_method=PaymentMethod.BKASH,
    )
    assert data.direction == "UP"
    assert data.payment_method == PaymentMethod.BKASH
