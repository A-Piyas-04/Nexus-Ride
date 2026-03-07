from sqlmodel import SQLModel
from datetime import date, datetime

class TokenHistoryRead(SQLModel):
    token_id: int
    travel_date: date
    route_name: str
    pickup_stop: str
    direction: str
    vehicle_number: str
    driver_name: str
    status: str
    created_at: datetime
