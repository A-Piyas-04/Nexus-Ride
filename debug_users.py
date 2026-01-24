from dotenv import load_dotenv
load_dotenv()

from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User
from app.models.subscription import Subscription

def inspect_db():
    with Session(engine) as session:
        print("--- Pending Subscriptions ---")
        subs = session.exec(select(Subscription).where(Subscription.status == "PENDING")).all()
        for sub in subs:
            user = session.get(User, sub.user_id)
            print(f"Sub ID: {sub.id}, User ID: {sub.user_id}")
            if user:
                print(f"  User Found: ID={user.id}")
                print(f"  Email: {user.email}")
                print(f"  Full Name: '{user.full_name}' (Type: {type(user.full_name)})")
            else:
                print("  User NOT Found!")

if __name__ == "__main__":
    inspect_db()
