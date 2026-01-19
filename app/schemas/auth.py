from sqlmodel import SQLModel, Field
from pydantic import EmailStr, constr, validator

IUT_EMAIL_DOMAIN = "@iut-dhaka.edu"

def normalize_iut_email(value: str) -> str:
    email = value.strip().lower()
    if not email.endswith(IUT_EMAIL_DOMAIN):
        raise ValueError("Only @iut-dhaka.edu emails are allowed")
    return email

class SignupRequest(SQLModel):
    email: EmailStr
    password: constr(min_length=8, max_length=128)
    full_name: constr(min_length=1, max_length=100)

    @validator("email")
    def email_must_be_iut(cls, value):
        return normalize_iut_email(value)

    class Config:
        extra = "forbid"

class LoginRequest(SQLModel):
    email: EmailStr
    password: constr(min_length=8, max_length=128)

    @validator("email")
    def email_must_be_iut(cls, value):
        return normalize_iut_email(value)

    class Config:
        extra = "forbid"
