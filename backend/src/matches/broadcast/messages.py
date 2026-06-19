"""Match-domain broadcasting: one function that pushes the current match state.

``broadcast(match, event_type)`` serializes the full match snapshot (the same
payload the matchroom ``retrieve`` returns), camelCases it, wraps it in one typed
event and publishes it through the configured :class:`Broadcaster`. It is a
best-effort, fire-and-forget side effect: the publish is deferred to
``transaction.on_commit`` (so it reflects committed state and never fires on a
rolled-back write) and wrapped so a broadcasting failure can never break the
request that triggered it.

The serializer import is LAZY (inside ``broadcast``) on purpose:
``matches.api.serializers`` imports from ``matches.services``, so importing it at
module load here would create a cycle.
"""

from __future__ import annotations

import logging
from enum import StrEnum
from typing import TYPE_CHECKING

from django.db import transaction
from djangorestframework_camel_case.util import camelize

from src.matches.broadcast.base import BroadcastEvent
from src.matches.broadcast.loading import get_broadcaster

if TYPE_CHECKING:
    from src.matches.models import Match

logger = logging.getLogger("matchroom.broadcast")


class BroadcastEventType(StrEnum):
    """Event-type labels on the envelope.

    ``MATCH_UPDATE`` is the generic default; the rest let a caller say *why* the
    snapshot was sent so subscribers can route/animate on it. Members are real
    ``str``, so they serialize straight onto the wire; a custom caller may also
    pass any plain string.
    """

    MATCH_UPDATE = "MATCH_UPDATE"
    MATCH_STARTED = "MATCH_STARTED"
    MATCH_PAUSED = "MATCH_PAUSED"
    MATCH_FINISHED = "MATCH_FINISHED"
    EVENT_ADDED = "MATCH_EVENT_ADDED"
    EVENT_REMOVED = "MATCH_EVENT_REMOVED"
    LINEUP_UPDATED = "LINEUP_UPDATED"
    STATS_UPDATED = "TEAM_STATS_UPDATED"


def match_channel(match: Match) -> str:
    """The vendor-neutral channel for a match's public stream."""
    return f"matches/{match.pid}"


def broadcast(
    match: Match,
    event_type: BroadcastEventType = BroadcastEventType.MATCH_UPDATE,
) -> None:
    """Publish the full current match snapshot, tagged with ``event_type``.

    Best-effort: fires after the surrounding transaction commits and never
    raises into the caller.
    """

    def _send() -> None:
        # Imported here, not at module top: matches.api.serializers imports
        # matches.services, so a top-level import would create a cycle.
        from src.matches.api.serializers import MatchroomSerializer  # noqa: PLC0415

        try:
            payload = camelize(MatchroomSerializer(match).data)
            event = BroadcastEvent(type=str(event_type), data=payload)
            get_broadcaster().publish(match_channel(match), [event])
        except Exception:
            logger.exception("broadcast failed for %s", match_channel(match))

    transaction.on_commit(_send)
