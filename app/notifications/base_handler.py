from abc import ABC, abstractmethod
from typing import Any
from sqlmodel import Session

class NotificationHandler(ABC):
    @property
    @abstractmethod
    def event_type(self) -> str:
        pass

    @abstractmethod
    def handle(self, payload: Any, session: Session) -> None:
        pass
