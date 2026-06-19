from __future__ import annotations

from datetime import timedelta
from http import HTTPStatus
from unittest.mock import patch

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from src.matches.models import Event
from src.matches.models import Match
from src.matches.models import PlayerPositionInMatch
from src.matches.models import TeamStatsInMatch
from src.matches.tests.factories import EventFactory
from src.matches.tests.factories import MatchFactory
from src.teams.models import Position
from src.teams.tests.factories import PlayerFactory
from src.teams.tests.factories import TeamFactory
from src.users.tests.factories import UserFactory

PASSWORD = "s3cret-matchroom-pw"  # noqa: S105

# Every request opens a transaction (ATOMIC_REQUESTS), so even the anonymous
# (read/401) cases need DB access.
pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def admin_client(api_client: APIClient) -> APIClient:
    user = UserFactory(password=PASSWORD)
    api_client.post(
        reverse("api:login"),
        {"email": user.email, "password": PASSWORD},
        format="json",
    )
    return api_client


class TestMatchListAndRetrieve:
    def test_anonymous_can_list_matches_as_cards(self, api_client: APIClient):
        matches = MatchFactory.create_batch(2)

        response = api_client.get(reverse("api:match-list"))

        assert response.status_code == HTTPStatus.OK
        assert response.data["count"] == len(matches)
        # Card payload embeds teams but not the full lineup/stats/events.
        row = response.data["results"][0]
        assert "home_team" in row
        assert "lineup" not in row
        # camelCase on the wire (rendered content), snake_case in `.data`.
        assert "homeTeam" in response.json()["results"][0]

    def test_retrieve_returns_matchroom_payload(self, api_client: APIClient):
        match = MatchFactory(home_score=1)

        response = api_client.get(reverse("api:match-detail", args=[match.pid]))

        assert response.status_code == HTTPStatus.OK
        assert response.data["home_score"] == 1
        assert response.data["home_formation"] == "4-3-3"
        assert set(response.data["lineup"]) == {"home", "away"}
        assert set(response.data["stats"]) == {"home", "away"}
        assert response.data["scorers"] == []
        # Full matchroom shape, camelCase on the wire.
        assert response.json()["homeScore"] == 1

    def test_filter_by_status(self, api_client: APIClient):
        MatchFactory(status=Match.Status.LIVE)
        MatchFactory(status=Match.Status.FINISHED)

        response = api_client.get(
            reverse("api:match-list"),
            {"status": Match.Status.LIVE},
        )

        assert response.data["count"] == 1

    def test_retrieve_orders_lineup_and_derives_scorers(self, api_client: APIClient):
        match = MatchFactory()
        keeper = PlayerFactory(team=match.home_team, position=Position.GOALKEEPER)
        striker = PlayerFactory(team=match.home_team, position=Position.FORWARD)
        PlayerPositionInMatch.objects.create(
            match=match,
            team=match.home_team,
            player=keeper,
            role=PlayerPositionInMatch.Role.STARTER,
            order=0,
        )
        PlayerPositionInMatch.objects.create(
            match=match,
            team=match.home_team,
            player=striker,
            role=PlayerPositionInMatch.Role.SUBSTITUTE,
            order=0,
        )
        EventFactory(
            match=match,
            type=Event.Type.GOAL,
            side=Event.Side.HOME,
            minute=38,
            primary_player=striker,
        )

        response = api_client.get(reverse("api:match-detail", args=[match.pid]))

        home = response.data["lineup"]["home"]
        assert [p["player"] for p in home["starters"]] == [keeper.pid]
        assert [p["player"] for p in home["subs"]] == [striker.pid]
        assert response.data["scorers"] == [
            {
                "side": Event.Side.HOME,
                "minute": 38,
                "name": striker.name,
                "player": striker.pid,
            },
        ]


class TestMatchWrites:
    def test_anonymous_cannot_create_match(self, api_client: APIClient):
        home, away = TeamFactory(), TeamFactory()

        response = api_client.post(
            reverse("api:match-list"),
            {"homeTeam": home.pid, "awayTeam": away.pid},
            format="json",
        )

        assert response.status_code == HTTPStatus.UNAUTHORIZED

    def test_admin_can_create_match(self, admin_client: APIClient):
        home, away = TeamFactory(), TeamFactory()
        payload = {
            "homeTeam": home.pid,
            "awayTeam": away.pid,
            "competition": "Coastal Premier League",
            "round": "Matchday 28",
            "status": Match.Status.LIVE,
        }

        response = admin_client.post(reverse("api:match-list"), payload, format="json")

        assert response.status_code == HTTPStatus.CREATED
        assert response.data["pid"].startswith("mt_")

    def test_admin_can_record_penalty_shootout(self, admin_client: APIClient):
        match = MatchFactory(home_score=2, away_score=2)
        payload = {
            "homeTeam": match.home_team.pid,
            "awayTeam": match.away_team.pid,
            "homeScore": 2,
            "awayScore": 2,
            "homePenaltyScore": 5,
            "awayPenaltyScore": 4,
        }

        response = admin_client.put(
            reverse("api:match-detail", args=[match.pid]),
            payload,
            format="json",
        )

        assert response.status_code == HTTPStatus.OK
        match.refresh_from_db()
        assert match.home_penalty_score == 5
        assert match.away_penalty_score == 4
        # The shootout decider is kept apart from the regular score.
        assert match.home_score == 2
        assert match.away_score == 2

        # The detail payload echoes the shootout result (camelCase on the wire).
        detail = admin_client.get(reverse("api:match-detail", args=[match.pid]))
        assert detail.json()["homePenaltyScore"] == 5
        assert detail.json()["awayPenaltyScore"] == 4

    def test_penalty_shootout_defaults_to_null(self, api_client: APIClient):
        match = MatchFactory()

        response = api_client.get(reverse("api:match-detail", args=[match.pid]))

        assert response.json()["homePenaltyScore"] is None
        assert response.json()["awayPenaltyScore"] is None


class TestMatchClock:
    def _url(self, match: Match) -> str:
        return reverse("api:match-clock", args=[match.pid])

    def test_anonymous_cannot_control_clock(self, api_client: APIClient):
        match = MatchFactory()

        response = api_client.post(self._url(match), {"action": "start"}, format="json")

        assert response.status_code == HTTPStatus.UNAUTHORIZED

    def test_start_goes_live_and_minute_advances(self, admin_client: APIClient):
        match = MatchFactory(status=Match.Status.SCHEDULED, kickoff_at=None)
        t0 = timezone.now()

        with patch("src.matches.services.clock.timezone.now", return_value=t0):
            start = admin_client.post(
                self._url(match), {"action": "start"}, format="json"
            )

        assert start.status_code == HTTPStatus.OK
        assert start.json()["status"] == Match.Status.LIVE

        # Seven minutes later, the derived minute has advanced on its own.
        with patch(
            "src.matches.models.timezone.now",
            return_value=t0 + timedelta(minutes=7, seconds=5),
        ):
            detail = admin_client.get(reverse("api:match-detail", args=[match.pid]))

        assert detail.json()["minute"] == 7

    def test_pause_freezes_the_clock(self, admin_client: APIClient):
        t0 = timezone.now()
        match = MatchFactory(
            status=Match.Status.LIVE,
            clock_started_at=t0,
            clock_elapsed_seconds=0,
        )

        with patch(
            "src.matches.services.clock.timezone.now",
            return_value=t0 + timedelta(minutes=30),
        ):
            response = admin_client.post(
                self._url(match), {"action": "pause"}, format="json"
            )

        assert response.status_code == HTTPStatus.OK
        match.refresh_from_db()
        assert match.clock_started_at is None
        assert match.clock_elapsed_seconds == 30 * 60

    def test_finish_marks_finished(self, admin_client: APIClient):
        match = MatchFactory(status=Match.Status.LIVE, clock_started_at=timezone.now())

        response = admin_client.post(
            self._url(match), {"action": "finish"}, format="json"
        )

        assert response.status_code == HTTPStatus.OK
        assert response.json()["status"] == Match.Status.FINISHED
        match.refresh_from_db()
        assert match.clock_started_at is None

    def test_set_applies_minute(self, admin_client: APIClient):
        match = MatchFactory(status=Match.Status.LIVE)

        response = admin_client.post(
            self._url(match),
            {"action": "set", "minute": 80},
            format="json",
        )

        assert response.status_code == HTTPStatus.OK
        match.refresh_from_db()
        assert match.clock_elapsed_seconds == 80 * 60

    def test_set_without_minute_is_rejected(self, admin_client: APIClient):
        match = MatchFactory()

        response = admin_client.post(self._url(match), {"action": "set"}, format="json")

        assert response.status_code == HTTPStatus.BAD_REQUEST


class TestNestedEvents:
    def test_anonymous_can_list_events(self, api_client: APIClient):
        match = MatchFactory()
        EventFactory(match=match)

        response = api_client.get(reverse("api:match-events", args=[match.pid]))

        assert response.status_code == HTTPStatus.OK
        assert response.data["count"] == 1

    def test_anonymous_cannot_create_event(self, api_client: APIClient):
        match = MatchFactory()

        response = api_client.post(
            reverse("api:match-events", args=[match.pid]),
            {"type": Event.Type.CORNER, "side": Event.Side.HOME, "minute": 5},
            format="json",
        )

        assert response.status_code == HTTPStatus.UNAUTHORIZED

    def test_goal_event_bumps_score(self, admin_client: APIClient):
        match = MatchFactory()

        response = admin_client.post(
            reverse("api:match-events", args=[match.pid]),
            {"type": Event.Type.GOAL, "side": Event.Side.AWAY, "minute": 38},
            format="json",
        )

        assert response.status_code == HTTPStatus.CREATED
        # GOAL is major by default.
        assert response.data["is_major"] is True
        match.refresh_from_db()
        assert match.away_score == 1
        assert match.home_score == 0

    def test_deleting_goal_event_reverts_score(self, admin_client: APIClient):
        match = MatchFactory(home_score=2)
        event = EventFactory(
            match=match,
            type=Event.Type.GOAL,
            side=Event.Side.HOME,
            minute=10,
        )

        response = admin_client.delete(
            reverse("api:match-event-detail", args=[match.pid, event.pid]),
        )

        assert response.status_code == HTTPStatus.NO_CONTENT
        match.refresh_from_db()
        assert match.home_score == 1

    def test_non_goal_event_leaves_score(self, admin_client: APIClient):
        match = MatchFactory()

        admin_client.post(
            reverse("api:match-events", args=[match.pid]),
            {"type": Event.Type.CORNER, "side": Event.Side.HOME, "minute": 12},
            format="json",
        )

        match.refresh_from_db()
        assert match.home_score == 0


class TestLineupAction:
    def test_set_lineup_sets_formation_and_positions(self, admin_client: APIClient):
        match = MatchFactory()
        keeper = PlayerFactory(team=match.home_team, position=Position.GOALKEEPER)
        defender = PlayerFactory(team=match.home_team, position=Position.DEFENDER)
        bench = PlayerFactory(team=match.home_team, position=Position.FORWARD)
        starters = [keeper.pid, defender.pid]
        subs = [bench.pid]

        response = admin_client.put(
            reverse("api:match-lineup", args=[match.pid]),
            {
                "side": Event.Side.HOME,
                "formation": "4-4-2",
                "starters": starters,
                "subs": subs,
            },
            format="json",
        )

        assert response.status_code == HTTPStatus.OK
        match.refresh_from_db()
        assert match.home_formation == "4-4-2"
        rows = PlayerPositionInMatch.objects.filter(match=match, team=match.home_team)
        assert rows.count() == len(starters) + len(subs)
        assert response.data["lineup"]["home"]["starters"][0]["player"] == keeper.pid

    def test_lineup_rejects_player_from_other_team(self, admin_client: APIClient):
        match = MatchFactory()
        outsider = PlayerFactory(team=TeamFactory())

        response = admin_client.put(
            reverse("api:match-lineup", args=[match.pid]),
            {"side": Event.Side.HOME, "starters": [outsider.pid]},
            format="json",
        )

        assert response.status_code == HTTPStatus.BAD_REQUEST

    def test_anonymous_cannot_set_lineup(self, api_client: APIClient):
        match = MatchFactory()

        response = api_client.put(
            reverse("api:match-lineup", args=[match.pid]),
            {"side": Event.Side.HOME, "starters": []},
            format="json",
        )

        assert response.status_code == HTTPStatus.UNAUTHORIZED


class TestTeamStatsAction:
    def test_upsert_team_stats_is_idempotent(self, admin_client: APIClient):
        match = MatchFactory()
        url = reverse("api:match-team-stats", args=[match.pid])
        updated_possession = 60

        first = admin_client.put(
            url,
            {"team": match.home_team.pid, "possession": 58, "totalShots": 12},
            format="json",
        )
        second = admin_client.put(
            url,
            {
                "team": match.home_team.pid,
                "possession": updated_possession,
                "totalShots": 14,
            },
            format="json",
        )

        assert first.status_code == HTTPStatus.OK
        assert second.status_code == HTTPStatus.OK
        assert second.data["possession"] == updated_possession
        assert second.data["shots_on_target"] == 0
        assert (
            TeamStatsInMatch.objects.filter(match=match, team=match.home_team).count()
            == 1
        )

    def test_team_stats_rejects_team_not_in_match(self, admin_client: APIClient):
        match = MatchFactory()
        outsider = TeamFactory()

        response = admin_client.put(
            reverse("api:match-team-stats", args=[match.pid]),
            {"team": outsider.pid, "possession": 50},
            format="json",
        )

        assert response.status_code == HTTPStatus.BAD_REQUEST
