from sqlmodel import SQLModel, Field
from pydantic import EmailStr, constr

class SignupRequest(SQLModel):
    email: EmailStr
    password: constr(min_length=8, max_length=128)
    full_name: constr(min_length=1, max_length=100)

    class Config:
        extra = "forbid"

class LoginRequest(SQLModel):
    email: EmailStr
    password: constr(min_length=8, max_length=128)

    class Config:
        extra = "forbid"
