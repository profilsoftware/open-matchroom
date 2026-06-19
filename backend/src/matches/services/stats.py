"""Per-team match statistics: an idempotent upsert keyed on (match, team)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError

from src.matches.broadcast import BroadcastEventType
from src.matches.broadcast import broadcast
from src.matches.models import Match
from src.matches.models import TeamStatsInMatch

if TYPE_CHECKING:
    from src.teams.models import Team


@transaction.atomic
def upsert_team_stats(match: Match, team: Team, **metrics) -> TeamStatsInMatch:
    """Create or update the stats row for ``team`` in ``match``.

    The team must be one of the match's two sides; metrics are the
    ``TeamStatsInMatch`` count fields (possession, shots, corners, ...).
    """
    if team.id not in {match.home_team_id, match.away_team_id}:
        raise ValidationError({"team": _("This team is not playing in the match.")})

    stats, _created = TeamStatsInMatch.objects.update_or_create(
        match=match,
        team=team,
        defaults=metrics,
    )
    broadcast(match, BroadcastEventType.STATS_UPDATED)
    return stats
