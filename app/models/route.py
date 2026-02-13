from sqlmodel import SQLModel, Field, Relationship
from uuid import UUID, uuid4
from typing import List, Optional


class Route(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    route_name: str
    is_active: bool = Field(default=True)

    stops: List["RouteStop"] = Relationship(back_populates="route")


class RouteStop(SQLModel, table=True):
    __tablename__ = "route_stop"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    route_id: UUID = Field(foreign_key="route.id")
    stop_name: str = Field(unique=True)
    sequence_number: int

    route: Optional[Route] = Relationship(back_populates="stops")
