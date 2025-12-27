from sqlmodel import SQLModel
from pydantic import EmailStr

class SignupRequest(SQLModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(SQLModel):
    email: EmailStr
    password: str
