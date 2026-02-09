import os
from sqlmodel import Session, select
from app.models.role import Role, UserRole
from app.models.user import User

def get_allowed_faculty_emails():
    """Reads the list of allowed faculty emails from the text file."""
    file_path = os.path.join(os.path.dirname(__file__), 'faculty_emails.txt')
    try:
        with open(file_path, 'r') as f:
            return [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"Warning: {file_path} not found.")
        return []

def assign_faculty_role_if_applicable(user: User, session: Session):
    """
    Checks if the user's email is in the allowed faculty list.
    If yes, assigns the FACULTY role.
    """
    allowed_emails = get_allowed_faculty_emails()
    
    if user.email in allowed_emails:
        faculty_role = session.exec(select(Role).where(Role.name == "FACULTY")).first()
        if faculty_role:
            # Check if already has role
            existing = session.exec(select(UserRole).where(
                UserRole.user_id == user.id, 
                UserRole.role_id == faculty_role.id
            )).first()
            
            if not existing:
                session.add(UserRole(user_id=user.id, role_id=faculty_role.id))
                print(f"Assigned FACULTY role to {user.email}")
