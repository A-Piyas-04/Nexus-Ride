from sqlmodel import SQLModel, Field
from typing import Optional

class Role(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

class UserRole(SQLModel, table=True):
    user_id: str = Field(primary_key=True, foreign_key="user.id")
    role_id: int = Field(primary_key=True, foreign_key="role.id")
