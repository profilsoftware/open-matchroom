"""A recording broadcaster used as a test double.

Importable by dotted path so ``override_settings(BROADCAST_BACKEND=...)`` can swap
it in; every publish lands on a class-level list the tests assert against.
"""

from __future__ import annotations

from src.matches.broadcast.base import Broadcaster
from src.matches.broadcast.base import BroadcastEvent


class RecordingBroadcaster(Broadcaster):
    published: list[tuple[str, list[BroadcastEvent]]] = []

    def publish(self, channel: str, events: list[BroadcastEvent]) -> None:
        type(self).published.append((channel, events))

    @classmethod
    def reset(cls) -> None:
        cls.published = []
