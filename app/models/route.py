from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4

class Route(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    route_name: str
    start_point: str
    end_point: str
    is_active: bool = Field(default=True)
