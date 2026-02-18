from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, constr
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.user import User
from app.models.profile import DriverProfile
from app.utils.hashing import hash_password, verify_password
from app.core.security import create_access_token, get_current_user
from uuid import UUID

router = APIRouter(prefix="/drivers", tags=["drivers"])

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

@router.post("/signup")
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

@router.post("/login")
def driver_login(data: DriverLoginRequest, session: Session = Depends(get_session)):
    mobile = validate_bd_mobile(data.mobile_number)
    user = session.exec(select(User).where(User.mobile_number == mobile)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Phone number is not signed up yet")
    if user.user_type != "DRIVER":
        raise HTTPException(status_code=400, detail="Invalid user type")
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="incorrect password")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}

@router.get("/requests")
def driver_requests(session: Session = Depends(get_session)):
    results = session.exec(
        select(DriverProfile, User)
        .join(User, DriverProfile.user_id == User.id)
        .where(DriverProfile.driver_status == 0)
    ).all()
    response = []
    for profile, user in results:
        response.append({
            "id": profile.id,
            "user_id": str(profile.user_id),
            "full_name": user.full_name,
            "mobile_number": profile.mobile_number,
            "license_number": profile.license_number,
        })
    return response

@router.put("/{id}/approve")
def approve_driver(id: int, session: Session = Depends(get_session)):
    profile = session.exec(select(DriverProfile).where(DriverProfile.id == id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Not found")
    profile.driver_status = 1
    session.add(profile)
    session.commit()
    return {"msg": "Approved"}

@router.get("/me")
def me(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    profile = session.exec(select(DriverProfile).where(DriverProfile.user_id == current_user.id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": profile.id,
        "user_id": str(profile.user_id),
        "mobile_number": profile.mobile_number,
        "license_number": profile.license_number,
        "driver_status": profile.driver_status,
        "assigned_vehicle_id": str(profile.assigned_vehicle_id) if profile.assigned_vehicle_id else None,
    }
