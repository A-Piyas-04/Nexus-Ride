# simple tests for subscription schemas

from datetime import date

from app.schemas.subscription import SubscriptionCreate, SubscriptionLeaveCreate


def test_subscription_create():
    data = SubscriptionCreate(
        start_month="January",
        end_month="March",
        year=2026,
        stop_name="Tongi",
    )
    assert data.stop_name == "Tongi"
    assert data.year == 2026


def test_leave_create():
    leave = SubscriptionLeaveCreate(
        subscription_id=1,
        from_date=date(2026, 8, 1),
        to_date=date(2026, 8, 5),
        reason="Trip",
    )
    assert leave.subscription_id == 1
    assert leave.reason == "Trip"
