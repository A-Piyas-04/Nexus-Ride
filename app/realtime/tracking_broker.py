import asyncio
import threading
from uuid import UUID
from typing import Any, Dict, Optional, Set


class TrackingBroker:
    """
    In-process pub/sub for live tracking events.
    Note: works best with a single backend process/worker.
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._queues: Dict[UUID, Set[asyncio.Queue]] = {}
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def subscribe(self, user_id: UUID) -> asyncio.Queue:
        # Called from an async request context (stream endpoint).
        loop = asyncio.get_running_loop()
        if self._loop is None:
            self._loop = loop

        q: asyncio.Queue = asyncio.Queue()
        with self._lock:
            self._queues.setdefault(user_id, set()).add(q)
        return q

    def unsubscribe(self, user_id: UUID, q: asyncio.Queue) -> None:
        with self._lock:
            if user_id in self._queues:
                self._queues[user_id].discard(q)
                if not self._queues[user_id]:
                    self._queues.pop(user_id, None)

    def publish(self, user_id: UUID, payload: Any) -> None:
        with self._lock:
            loop = self._loop
            queues = list(self._queues.get(user_id, set()))

        if loop is None:
            # No active stream subscribers yet.
            return

        for q in queues:
            def _put(target_q=q, item=payload):
                try:
                    target_q.put_nowait(item)
                except asyncio.QueueFull:
                    pass

            loop.call_soon_threadsafe(_put)


tracking_broker = TrackingBroker()

