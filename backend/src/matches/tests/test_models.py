from __future__ import annotations

import pytest
from django.db import IntegrityError

from src.matches.models import Match
from src.matches.tests.factories import EventFactory
from src.matches.tests.factories import MatchFactory
from src.matches.tests.factories import PlayerPositionInMatchFactory
from src.matches.tests.factories import TeamStatsInMatchFactory

pytestmark = pytest.mark.django_db

PID_TOKEN_LENGTH = 12


class TestMatchModel:
    def test_pid_assigned_with_prefix(self):
        match = MatchFactory()

        assert match.pid.startswith("mt_")
        assert len(match.pid) == len("mt_") + PID_TOKEN_LENGTH

    def test_defaults(self):
        match = MatchFactory()

        assert match.status == Match.Status.SCHEDULED
        assert match.minute == 0
        assert match.home_score == 0
        assert match.away_score == 0
        assert match.home_formation == "4-3-3"
        assert match.away_formation == "4-3-3"

    def test_str_is_home_vs_away(self):
        match = MatchFactory()

        assert str(match) == f"{match.home_team.name} vs {match.away_team.name}"


class TestEventModel:
    def test_pid_assigned_with_prefix(self):
        event = EventFactory()

        assert event.pid.startswith("ev_")

    def test_str_includes_type_and_minute(self):
        event = EventFactory(minute=38)

        assert "38'" in str(event)


class TestTeamStatsInMatchModel:
    def test_pid_prefix_and_defaults(self):
        stats = TeamStatsInMatchFactory()

        assert stats.pid.startswith("ts_")
        assert stats.possession == 0
        assert stats.total_shots == 0

    def test_unique_per_match_and_team(self):
        stats = TeamStatsInMatchFactory()

        with pytest.raises(IntegrityError):
            TeamStatsInMatchFactory(match=stats.match, team=stats.team)


class TestPlayerPositionInMatchModel:
    def test_pid_prefix(self):
        position = PlayerPositionInMatchFactory()

        assert position.pid.startswith("pp_")

    def test_unique_per_match_and_player(self):
        position = PlayerPositionInMatchFactory()

        with pytest.raises(IntegrityError):
            PlayerPositionInMatchFactory(
                match=position.match,
                player=position.player,
            )
