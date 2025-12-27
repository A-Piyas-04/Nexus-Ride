from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlmodel import SQLModel
from app.db.session import engine
from app.api.auth import router as auth_router

# Import models to ensure they are registered with SQLModel
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.subscription import Subscription

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    SQLModel.metadata.create_all(engine)
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
