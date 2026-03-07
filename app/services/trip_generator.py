"""
Generates Trip rows for a given date from active TripTemplates,
applying ScheduleOverrides (e.g. Ramadan timing, holiday cancellation).
"""
from datetime import date
from typing import Optional

from sqlmodel import Session, select

from app.models.trip import Trip
from app.models.trip_template import TripTemplate
from app.models.schedule_override import ScheduleOverride


def _template_valid_on(template: TripTemplate, target_date: date) -> bool:
    if template.valid_from is not None and target_date < template.valid_from:
        return False
    if template.valid_to is not None and target_date > template.valid_to:
        return False
    return True


def generate_trips_for_date(session: Session, target_date: date) -> None:
    """
    For a given date: load active templates, apply overrides, and create
    Trip rows that do not already exist (enforced by unique constraint).
    """
    templates = session.exec(
        select(TripTemplate).where(TripTemplate.is_active == True)
    ).all()

    overrides_by_route: dict[tuple, ScheduleOverride] = {}
    for override in session.exec(
        select(ScheduleOverride).where(ScheduleOverride.date == target_date)
    ).all():
        overrides_by_route[(override.route_id, override.date)] = override

    for template in templates:
        if not _template_valid_on(template, target_date):
            continue

        override = overrides_by_route.get((template.route_id, target_date))
        if override is not None and override.is_cancelled:
            continue

        effective_start_time = (
            override.new_start_time if override and override.new_start_time is not None
            else template.start_time
        )

        existing = session.exec(
            select(Trip).where(
                Trip.route_id == template.route_id,
                Trip.trip_date == target_date,
                Trip.start_time == effective_start_time,
                Trip.direction == template.direction,
            )
        ).first()
        if existing is not None:
            continue

        session.add(
            Trip(
                vehicle_id=template.vehicle_id,
                driver_profile_id=template.driver_profile_id,
                route_id=template.route_id,
                direction=template.direction,
                trip_date=target_date,
                start_time=effective_start_time,
                status="SCHEDULED",
            )
        )

    session.commit()
