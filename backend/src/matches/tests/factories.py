from __future__ import annotations

from factory import SubFactory
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyChoice

from src.matches.models import Event
from src.matches.models import Match
from src.matches.models import PlayerPositionInMatch
from src.matches.models import TeamStatsInMatch
from src.teams.tests.factories import PlayerFactory
from src.teams.tests.factories import TeamFactory


class MatchFactory(DjangoModelFactory[Match]):
    home_team = SubFactory(TeamFactory)
    away_team = SubFactory(TeamFactory)
    competition = "Coastal Premier League"
    round = "Matchday 28"
    venue = "Harbor Arena"
    status = Match.Status.SCHEDULED

    class Meta:
        model = Match


class EventFactory(DjangoModelFactory[Event]):
    match = SubFactory(MatchFactory)
    side = Event.Side.HOME
    type = FuzzyChoice(Event.Type.values)
    minute = 1

    class Meta:
        model = Event


class TeamStatsInMatchFactory(DjangoModelFactory[TeamStatsInMatch]):
    match = SubFactory(MatchFactory)
    team = SubFactory(TeamFactory)

    class Meta:
        model = TeamStatsInMatch


class PlayerPositionInMatchFactory(DjangoModelFactory[PlayerPositionInMatch]):
    match = SubFactory(MatchFactory)
    player = SubFactory(PlayerFactory)
    team = SubFactory(TeamFactory)
    role = PlayerPositionInMatch.Role.STARTER
    order = 0

    class Meta:
        model = PlayerPositionInMatch
