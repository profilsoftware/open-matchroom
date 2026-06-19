"""Pluggable real-time broadcasting for the match center.

A no-op by default; point ``BROADCAST_BACKEND`` at a custom client to go live.
See ``README.md`` for the interface, the event catalog and how to plug in a real
transport. Domain code calls a single function::

    from src.matches.broadcast import broadcast, BroadcastEventType

    broadcast(match, BroadcastEventType.MATCH_STARTED)
"""

from src.matches.broadcast.base import Broadcaster
from src.matches.broadcast.base import BroadcastEvent
from src.matches.broadcast.loading import get_broadcaster
from src.matches.broadcast.messages import BroadcastEventType
from src.matches.broadcast.messages import broadcast
from src.matches.broadcast.messages import match_channel

__all__ = [
    "BroadcastEvent",
    "BroadcastEventType",
    "Broadcaster",
    "broadcast",
    "get_broadcaster",
    "match_channel",
]
