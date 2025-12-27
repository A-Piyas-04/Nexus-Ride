from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from typing import Optional

class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: Optional[str] = Field(default=None, unique=True)
    password_hash: str
    full_name: str
    user_type: str   # STAFF / DRIVER
