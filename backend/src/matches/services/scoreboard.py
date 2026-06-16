"""Scoreboard derivations: the hero scorer list, built from goal events."""

from src.matches.models import GOAL_EVENT_TYPES
from src.matches.models import Match


def goal_scorers(match: Match) -> list[dict]:
    """Chronological scorer list derived from the match's goal/penalty events.

    Each entry carries the scoring ``side``, the ``minute``, and the scorer's
    display ``name`` + ``pid`` (null when no player is attached to the goal).
    """
    goals = sorted(
        (e for e in match.events.all() if e.type in GOAL_EVENT_TYPES and e.side),
        key=lambda e: (e.minute, e.created),
    )
    return [
        {
            "side": event.side,
            "minute": event.minute,
            "name": event.primary_player.name if event.primary_player else None,
            "player": event.primary_player.pid if event.primary_player else None,
        }
        for event in goals
    ]
