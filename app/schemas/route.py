from sqlmodel import SQLModel
from uuid import UUID


from typing import List, Optional

class RouteStopBase(SQLModel):
    stop_name: str
    sequence_number: int


class RouteStopCreate(RouteStopBase):
    pass


class RouteStopRead(RouteStopBase):
    id: UUID
    route_id: UUID


class RouteBase(SQLModel):
    route_name: str
    is_active: bool = True


class RouteCreate(RouteBase):
    stops: List[RouteStopCreate] = []


class RouteRead(RouteBase):
    id: UUID


class RouteWithStopsRead(RouteRead):
    stops: List[RouteStopRead] = []
