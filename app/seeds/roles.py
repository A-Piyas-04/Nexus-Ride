from sqlmodel import Session, select
from app.models.role import Role, UserRole
from app.models.user import User
from app.utils.hashing import hash_password
from app.core.to_credentials import TO_EMAIL, TO_PASSWORD

def seed_roles_and_to(session: Session):
    for name in ["NORMAL_STAFF", "FACULTY", "TO"]:
        existing = session.exec(select(Role).where(Role.name == name)).first()
        if not existing:
            session.add(Role(name=name))
    
    # Ensure TO user exists
    to_user = session.exec(select(User).where(User.email == TO_EMAIL)).first()
    if not to_user:
        to_user = User(
            email=TO_EMAIL,
            password_hash=hash_password(TO_PASSWORD),
            full_name="Transport Officer",
            user_type="STAFF"
        )
        session.add(to_user)
        session.flush()
        
        # Assign roles: NORMAL_STAFF and TO
        normal_staff_role = session.exec(select(Role).where(Role.name == "NORMAL_STAFF")).first()
        to_role = session.exec(select(Role).where(Role.name == "TO")).first()
        
        if normal_staff_role:
            session.add(UserRole(user_id=to_user.id, role_id=normal_staff_role.id))
        if to_role:
            session.add(UserRole(user_id=to_user.id, role_id=to_role.id))
        
        session.commit()
    else:
        session.commit()
