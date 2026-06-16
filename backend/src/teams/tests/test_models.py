from __future__ import annotations

import pytest

from src.teams.models import Position
from src.teams.tests.factories import PlayerFactory
from src.teams.tests.factories import TeamFactory

pytestmark = pytest.mark.django_db

PID_TOKEN_LENGTH = 12


class TestTeamModel:
    def test_pid_assigned_with_prefix(self):
        team = TeamFactory()

        assert team.pid.startswith("tm_")
        assert len(team.pid) == len("tm_") + PID_TOKEN_LENGTH

    def test_pids_are_unique(self):
        assert TeamFactory().pid != TeamFactory().pid

    def test_str_is_name(self):
        team = TeamFactory(name="Harbor City FC")

        assert str(team) == "Harbor City FC"


class TestPlayerModel:
    def test_pid_assigned_with_prefix(self):
        player = PlayerFactory()

        assert player.pid.startswith("pl_")
        assert len(player.pid) == len("pl_") + PID_TOKEN_LENGTH

    def test_str_is_name(self):
        player = PlayerFactory(name="M. Okafor")

        assert str(player) == "M. Okafor"

    def test_player_is_reachable_via_team_squad(self):
        team = TeamFactory()
        player = PlayerFactory(team=team, position=Position.GOALKEEPER)

        assert list(team.players.all()) == [player]
