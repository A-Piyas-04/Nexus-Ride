"""
Daily cron at 00:05 to generate trips for today from TripTemplates.
"""
import logging
from datetime import date
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from sqlmodel import Session

from app.db.session import engine
from app.services.trip_generator import generate_trips_for_date

logger = logging.getLogger(__name__)
_scheduler: Optional[BackgroundScheduler] = None


def _run_daily_trip_generation() -> None:
    try:
        with Session(engine) as session:
            generate_trips_for_date(session, date.today())
        logger.info("Daily trip generation completed for %s", date.today())
    except Exception as e:
        logger.exception("Daily trip generation failed: %s", e)


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        _run_daily_trip_generation,
        "cron",
        hour=0,
        minute=5,
        id="daily_trip_generation",
    )
    _scheduler.start()
    logger.info("Scheduler started (daily trip generation at 00:05)")


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is None:
        return
    _scheduler.shutdown(wait=False)
    _scheduler = None
    logger.info("Scheduler stopped")
