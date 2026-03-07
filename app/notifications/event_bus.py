from typing import Dict, List, Type, Any
from sqlmodel import Session
from app.notifications.base_handler import NotificationHandler
import logging

logger = logging.getLogger(__name__)

class EventBus:
    _instance = None
    _handlers: Dict[str, List[NotificationHandler]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EventBus, cls).__new__(cls)
            cls._handlers = {}
        return cls._instance

    def register(self, handler: NotificationHandler):
        if handler.event_type not in self._handlers:
            self._handlers[handler.event_type] = []
        self._handlers[handler.event_type].append(handler)
        logger.info(f"Registered handler {handler.__class__.__name__} for event {handler.event_type}")

    def emit(self, event_type: str, payload: Any, session: Session):
        if event_type in self._handlers:
            for handler in self._handlers[event_type]:
                try:
                    handler.handle(payload, session)
                except Exception as e:
                    logger.error(f"Error handling event {event_type} with {handler.__class__.__name__}: {e}")
        else:
            logger.warning(f"No handlers registered for event {event_type}")

event_bus = EventBus()
