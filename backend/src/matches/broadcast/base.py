"""The broadcasting contract: a single, transport-agnostic interface.

A :class:`Broadcaster` pushes typed events onto a named channel. Everything
beyond that — signing, batching, connection pooling, retries — is an
implementation concern and must not leak into this interface. Ship your own
client by subclassing :class:`Broadcaster` and pointing ``BROADCAST_BACKEND`` at
it (see this package's ``README.md``). The default ships as a no-op, so the
project runs with zero config.
"""

from __future__ import annotations

from abc import ABC
from abc import abstractmethod
from dataclasses import dataclass
from dataclasses import field


@dataclass(frozen=True)
class BroadcastEvent:
    """One typed message on a channel.

    ``type`` is a stable identifier subscribers route on (see
    ``messages.BroadcastEventType``); ``data`` is a JSON-serializable, camelCased
    payload ready for the wire.
    """

    type: str
    data: dict = field(default_factory=dict)


class Broadcaster(ABC):
    """Pushes real-time events to subscribers. The default ships as a no-op.

    Custom clients receive their configuration through ``**options`` (the
    ``BROADCAST_OPTIONS`` setting) and implement a single method.
    """

    def __init__(self, **options) -> None:
        self.options = options

    @abstractmethod
    def publish(self, channel: str, events: list[BroadcastEvent]) -> None:
        """Deliver ``events`` to everyone subscribed to ``channel``.

        Side-effect only (no return). Implementations decide how to
        batch/sign/transport; raising is allowed — the domain ``broadcast()``
        isolates failures so a broadcast never breaks the request.
        """
        raise NotImplementedError
