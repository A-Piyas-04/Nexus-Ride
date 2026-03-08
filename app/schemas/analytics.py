from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class RidershipOverTimePoint(BaseModel):
    date: date
    trips_count: int
    seats_used: int


class RidershipByRoutePoint(BaseModel):
    route_id: UUID
    route_name: str
    trips_count: int
    passengers_total: int


class RevenueOverTimePoint(BaseModel):
    date: date
    total_amount: Decimal
    token_count: int
    subscription_count: int
