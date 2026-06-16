"""Lineup writes: set one side's formation + positioned starters/bench."""

from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError

from src.matches.models import Event
from src.matches.models import Match
from src.matches.models import PlayerPositionInMatch
from src.teams.models import Player

MAX_STARTERS = 11


@transaction.atomic
def set_lineup(
    match: Match,
    side: str,
    formation: str,
    starter_ids: list[str],
    sub_ids: list[str],
) -> list[PlayerPositionInMatch]:
    """Replace one side's lineup.

    Validates that every player belongs to that side's team and that there are at
    most eleven starters, sets ``Match.<side>_formation`` (when given) and rewrites
    that side's ``PlayerPositionInMatch`` rows, preserving the given order (the
    starter index is the pitch slot, the sub index is bench order).
    """
    team = match.home_team if side == Event.Side.HOME else match.away_team
    starter_ids = list(starter_ids or [])
    sub_ids = list(sub_ids or [])

    if len(starter_ids) > MAX_STARTERS:
        raise ValidationError(
            {
                "starters": _("A lineup may have at most %(n)d starters.")
                % {"n": MAX_STARTERS},
            },
        )

    ordered_pids = starter_ids + sub_ids
    players = {p.pid: p for p in Player.objects.filter(pid__in=ordered_pids)}

    missing = [pid for pid in ordered_pids if pid not in players]
    if missing:
        raise ValidationError(
            {"players": _("Unknown players: %(pids)s.") % {"pids": ", ".join(missing)}},
        )

    wrong_team = [pid for pid in ordered_pids if players[pid].team_id != team.id]
    if wrong_team:
        raise ValidationError(
            {
                "players": _("These players are not in the %(side)s team: %(pids)s.")
                % {"side": side, "pids": ", ".join(wrong_team)},
            },
        )

    if formation:
        if side == Event.Side.HOME:
            match.home_formation = formation
        else:
            match.away_formation = formation
        match.save(update_fields=["home_formation", "away_formation", "modified"])

    PlayerPositionInMatch.objects.filter(match=match, team=team).delete()

    rows = [
        PlayerPositionInMatch(
            match=match,
            team=team,
            player=players[pid],
            role=role,
            order=order,
            position=players[pid].position,
        )
        for role, pids in (
            (PlayerPositionInMatch.Role.STARTER, starter_ids),
            (PlayerPositionInMatch.Role.SUBSTITUTE, sub_ids),
        )
        for order, pid in enumerate(pids)
    ]
    PlayerPositionInMatch.objects.bulk_create(rows)
    return rows
