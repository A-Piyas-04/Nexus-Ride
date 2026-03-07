"""
One-off script to set all seed drivers to approved (driver_status=1).
Run from project root (Nexus_Ride):  python -m app.scripts.approve_seed_drivers
"""
import sys
from pathlib import Path

# Ensure app is on path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User
from app.models.profile import DriverProfile
from app.seeds.drivers import SEED_DRIVER_MOBILES


def main():
    with Session(engine) as session:
        profiles = session.exec(
            select(DriverProfile)
            .join(User, DriverProfile.user_id == User.id)
            .where(User.mobile_number.in_(SEED_DRIVER_MOBILES))
        ).all()
        updated = 0
        for profile in profiles:
            if profile.driver_status != 1:
                profile.driver_status = 1
                session.add(profile)
                updated += 1
        session.commit()
        print(f"Approved {updated} seed driver(s). Total seed drivers: {len(profiles)}.")


if __name__ == "__main__":
    main()
