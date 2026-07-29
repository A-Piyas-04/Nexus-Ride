# shared setup so app imports work
import os
from dotenv import load_dotenv

load_dotenv()

if os.getenv("DATABASE_URL") is None:
    os.environ["DATABASE_URL"] = "sqlite:///./nexusride.db"
