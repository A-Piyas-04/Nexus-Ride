import os
import logging
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.user import User
from uuid import UUID

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=8)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        # Check if it's in the header manually if oauth2_scheme failed
        # This can happen if the client doesn't use the 'Bearer ' prefix correctly
        # though standard is better.
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    user = session.get(User, user_id)
    if user is None:
        user = session.exec(select(User).where(User.id == user_id_str)).first()
        
    if user is None:
        raise credentials_exception
    
    return user
