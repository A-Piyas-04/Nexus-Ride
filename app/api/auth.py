from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.role import Role, UserRole
from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest
from app.utils.hashing import hash_password, verify_password
from app.core.security import create_access_token, get_current_user
from datetime import datetime

router = APIRouter(prefix="/auth")

@router.post("/signup")
def signup(data: SignupRequest, session: Session = Depends(get_session)):
    email = data.email.strip().lower()

    existing_user = session.exec(select(User).where(User.email == email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        user_type="STAFF"
    )
    session.add(user)
    session.flush()

    default_role = session.exec(select(Role).where(Role.name == "NORMAL_STAFF")).first()
    if not default_role:
        default_role = Role(name="NORMAL_STAFF")
        session.add(default_role)
        session.flush()

    session.add(UserRole(user_id=user.id, role_id=default_role.id))

    session.commit()
    return {"msg": "Signup successful"}

@router.post("/login")
def login(data: LoginRequest, session: Session = Depends(get_session)):
    email = data.email.strip().lower()
    user = session.exec(
        select(User).where(User.email == email)
    ).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401)

    user.last_login = datetime.utcnow()
    session.add(user)
    session.commit()

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "user_type": current_user.user_type,
    }
