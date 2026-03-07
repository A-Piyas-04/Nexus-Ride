from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlmodel import Session, select
from datetime import datetime, timedelta
from app.db.session import engine
from app.models.trip import Trip
from app.notifications.service import create_notification
from app.models.seat_allocation import SeatAllocation
from app.models.user import User

async def send_trip_reminders():
    """
    Background job to send reminders for trips starting in 1 hour.
    """
    print("Running trip reminder job...")
    with Session(engine) as session:
        # Calculate time window (e.g., trips starting in the next 1 hour)
        now = datetime.now()
        one_hour_later = now + timedelta(hours=1)
        
        # This is a simplified query. In reality, we need to handle date/time fields properly
        # Assuming trip_date and start_time logic.
        
        # Placeholder for actual logic
        pass

async def send_system_announcements():
    """
    Background job to send system announcements.
    """
    pass

def register_jobs(scheduler: AsyncIOScheduler):
    # scheduler.add_job(send_trip_reminders, 'interval', minutes=15)
    pass
