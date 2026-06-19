"""The default broadcaster: does nothing.

Real-time is opt-in — configure ``BROADCAST_BACKEND`` to a real client (see the
package ``README.md``) to turn it on. With the no-op in place, the ``broadcast()``
calls scattered through the match services are safe to leave running with no
transport configured.
"""

from __future__ import annotations

from src.matches.broadcast.base import Broadcaster
from src.matches.broadcast.base import BroadcastEvent


class NoOpBroadcaster(Broadcaster):
    """Swallows every publish."""

    def publish(self, channel: str, events: list[BroadcastEvent]) -> None:
        return
