from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["bcrypt"])

def hash_password(password: str):
    return pwd_ctx.hash(password)

def verify_password(password, hashed):
    return pwd_ctx.verify(password, hashed)
