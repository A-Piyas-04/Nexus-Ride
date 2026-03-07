from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, constr
from sqlmodel import Session, select
from datetime import datetime

from app.db.session import get_session
from app.models.role import Role, UserRole
from app.models.user import User
from app.models.profile import StaffProfile, DriverProfile
from app.schemas.auth import SignupRequest, LoginRequest
from app.utils.hashing import hash_password, verify_password
from app.core.security import create_access_token, get_current_user
from app.seeds.faculty import assign_faculty_role_if_applicable
from app.seeds.drivers import SEED_DRIVER_MOBILES
from app.api.drivers import router as drivers_router


router = APIRouter(prefix="/auth")


@router.post("/signup")
def signup(data: SignupRequest, session: Session = Depends(get_session)):
    email = data.email

    existing_user = session.exec(select(User).where(User.email == email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        user_type="STAFF",
    )
    session.add(user)
    session.flush()

    default_role = session.exec(select(Role).where(Role.name == "NORMAL_STAFF")).first()
    if not default_role:
        default_role = Role(name="NORMAL_STAFF")
        session.add(default_role)
        session.flush()

    session.add(UserRole(user_id=user.id, role_id=default_role.id))

    assign_faculty_role_if_applicable(user, session)

    staff_code = f"STAFF-{str(user.id)[:8]}"
    profile = StaffProfile(
        user_id=user.id,
        email=user.email,
        mobile_number=user.mobile_number,
        staff_code=staff_code,
        department="",
        default_route_id=None,
        default_pickup_stop_id=None,
    )
    session.add(profile)

    session.commit()
    return {"msg": "Signup successful"}


@router.post("/login")
def login(data: LoginRequest, session: Session = Depends(get_session)):
    email = data.email
    user = session.exec(select(User).where(User.email == email)).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401)

    user.last_login = datetime.utcnow()
    session.add(user)
    session.commit()

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}


@router.get("/me")
def me(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    roles = session.exec(select(Role).join(UserRole).where(UserRole.user_id == current_user.id)).all()
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "user_type": current_user.user_type,
        "roles": [{"id": r.id, "name": r.name} for r in roles],
    }


class DriverSignupRequest(BaseModel):
    full_name: constr(min_length=1, max_length=100)
    mobile_number: constr(min_length=11, max_length=11)
    password: constr(min_length=8, max_length=128)
    license_number: constr(min_length=1, max_length=64)


class DriverLoginRequest(BaseModel):
    mobile_number: constr(min_length=11, max_length=11)
    password: constr(min_length=8, max_length=128)


def validate_bd_mobile(number: str) -> str:
    n = (number or "").strip()
    if len(n) != 11 or not n.isdigit() or not n.startswith("01"):
        raise HTTPException(status_code=400, detail="Invalid phone number")
    return n


@drivers_router.post("/signup")
def driver_signup(data: DriverSignupRequest, session: Session = Depends(get_session)):
    mobile = validate_bd_mobile(data.mobile_number)

    existing_user = session.exec(select(User).where(User.mobile_number == mobile)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="number has been already used")

    user = User(
        mobile_number=mobile,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        user_type="DRIVER",
    )
    session.add(user)
    session.flush()

    profile = DriverProfile(
        user_id=user.id,
        mobile_number=mobile,
        license_number=data.license_number,
        driver_status=0,
    )
    session.add(profile)
    session.commit()
    return {"msg": "Signup successful"}


@drivers_router.post("/login")
def driver_login(data: DriverLoginRequest, session: Session = Depends(get_session)):
    mobile = validate_bd_mobile(data.mobile_number)
    user = session.exec(select(User).where(User.mobile_number == mobile)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Phone number is not signed up yet")
    if user.user_type != "DRIVER":
        raise HTTPException(status_code=400, detail="Invalid user type")
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="incorrect password")

    # Seed drivers (hardcoded in seed data) are always treated as verified: ensure they are approved
    # so they don't show as "pending approval" and can start/complete trips.
    if user.mobile_number and user.mobile_number in SEED_DRIVER_MOBILES:
        profile = session.exec(select(DriverProfile).where(DriverProfile.user_id == user.id)).first()
        if profile and profile.driver_status != 1:
            profile.driver_status = 1
            session.add(profile)
            session.commit()

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}
