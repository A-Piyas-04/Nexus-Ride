from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4

class RouteStop(SQLModel, table=True):
    __tablename__ = "route_stop" # Explicit table name to match plan (snake_case is default but explicit is good)
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    route_id: UUID = Field(foreign_key="route.id")
    stop_name: str
    sequence_number: int
