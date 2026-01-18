from sqlmodel import SQLModel
from uuid import UUID


class RouteStopBase(SQLModel):
    stop_name: str
    sequence_number: int


class RouteStopCreate(RouteStopBase):
    route_id: UUID


class RouteStopRead(RouteStopBase):
    id: UUID
    route_id: UUID


class RouteBase(SQLModel):
    route_name: str
    is_active: bool = True


class RouteCreate(RouteBase):
    pass


class RouteRead(RouteBase):
    id: UUID
