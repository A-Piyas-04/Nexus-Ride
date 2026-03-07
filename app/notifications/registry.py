import importlib
import pkgutil
import inspect
from app.notifications.base_handler import NotificationHandler
from app.notifications.event_bus import event_bus
import app.notifications.handlers

def discover_handlers():
    """
    Automatically discover and register all NotificationHandler subclasses
    found in the app.notifications.handlers package.
    """
    package = app.notifications.handlers
    path = package.__path__
    prefix = package.__name__ + "."

    for _, name, is_pkg in pkgutil.iter_modules(path, prefix):
        if not is_pkg:
            module = importlib.import_module(name)
            for _, obj in inspect.getmembers(module):
                if (
                    inspect.isclass(obj)
                    and issubclass(obj, NotificationHandler)
                    and obj is not NotificationHandler
                ):
                    # Instantiate and register
                    handler_instance = obj()
                    event_bus.register(handler_instance)
