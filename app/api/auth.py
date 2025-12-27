from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest
from app.utils.hashing import hash_password, verify_password
from app.core.security import create_access_token

router = APIRouter(prefix="/auth")

@router.post("/signup")
def signup(data: SignupRequest, session: Session = Depends(get_session)):
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        user_type="STAFF"
    )
    session.add(user)
    session.commit()
    return {"msg": "Signup successful"}

@router.post("/login")
def login(data: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(
        select(User).where(User.email == data.email)
    ).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}
