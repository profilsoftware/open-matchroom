"""Event timeline writes. Goal/penalty events move the scoreboard."""

from django.db import transaction

from src.matches.models import GOAL_EVENT_TYPES
from src.matches.models import MAJOR_EVENT_TYPES
from src.matches.models import Event
from src.matches.models import Match


def _adjust_score(match: Match, side: str, delta: int) -> None:
    field = "home_score" if side == Event.Side.HOME else "away_score"
    new_value = max(0, getattr(match, field) + delta)
    setattr(match, field, new_value)
    match.save(update_fields=[field, "modified"])


def _is_scoring(event_type: str, side: str | None) -> bool:
    return event_type in GOAL_EVENT_TYPES and side in {Event.Side.HOME, Event.Side.AWAY}


@transaction.atomic
def create_event(match: Match, **data) -> Event:
    """Create an event; a goal/penalty bumps the scoring side's score by one."""
    event_type = data["type"]
    data.setdefault("is_major", event_type in MAJOR_EVENT_TYPES)

    event = Event.objects.create(match=match, **data)

    if _is_scoring(event_type, data.get("side")):
        _adjust_score(match, data["side"], 1)

    return event


@transaction.atomic
def delete_event(event: Event) -> None:
    """Delete an event; a goal/penalty reverts the scoring side's score by one."""
    match = event.match
    reverts_score = _is_scoring(event.type, event.side)
    side = event.side

    event.delete()

    if reverts_score:
        _adjust_score(match, side, -1)
