"""Squad presentation helpers: roster ordering and a default crest colour."""

from django.db.models import Case
from django.db.models import F
from django.db.models import IntegerField
from django.db.models import QuerySet
from django.db.models import Value
from django.db.models import When

from src.teams.models import Player
from src.teams.models import Position
from src.teams.models import Team

# White-label default crest colour (steel blue).
DEFAULT_CREST_COLOR = "#3b6fa6"

# Pitch order: keepers first, then defence -> midfield -> attack.
_POSITION_WEIGHTS = {
    Position.GOALKEEPER: 0,
    Position.DEFENDER: 1,
    Position.MIDFIELDER: 2,
    Position.FORWARD: 3,
}


def order_squad(players: QuerySet[Player]) -> QuerySet[Player]:
    """Order a player queryset GK->DF->MF->FW, then by ascending shirt number."""
    position_rank = Case(
        *[
            When(position=value, then=Value(weight))
            for value, weight in _POSITION_WEIGHTS.items()
        ],
        default=Value(len(_POSITION_WEIGHTS)),
        output_field=IntegerField(),
    )
    return players.alias(_position_rank=position_rank).order_by(
        "_position_rank",
        F("number").asc(nulls_last=True),
        "name",
    )


def crest_color(team: Team) -> str:
    """The team's crest colour, falling back to the white-label default."""
    return team.color or DEFAULT_CREST_COLOR
