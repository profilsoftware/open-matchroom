from __future__ import annotations

from http import HTTPStatus

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from src.teams.models import Player
from src.teams.models import Position
from src.teams.models import Team
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


class TestTeamViewSet:
    def test_anonymous_can_list_teams(self, api_client: APIClient):
        teams = TeamFactory.create_batch(3)

        response = api_client.get(reverse("api:team-list"))

        assert response.status_code == HTTPStatus.OK
        assert response.data["count"] == len(teams)

    def test_anonymous_can_retrieve_team(self, api_client: APIClient):
        team = TeamFactory(name="Harbor City FC")

        response = api_client.get(reverse("api:team-detail", args=[team.pid]))

        assert response.status_code == HTTPStatus.OK
        assert response.data["name"] == "Harbor City FC"

    def test_anonymous_cannot_create_team(self, api_client: APIClient):
        response = api_client.post(
            reverse("api:team-list"),
            {"name": "Harbor City FC"},
            format="json",
        )

        assert response.status_code == HTTPStatus.UNAUTHORIZED

    def test_admin_can_create_team(self, admin_client: APIClient):
        payload = {
            "name": "Harbor City FC",
            "shortName": "Harbor City",
            "abbreviation": "HAR",
            "city": "Harbor City",
            "color": "#2f6ca8",
        }

        response = admin_client.post(reverse("api:team-list"), payload, format="json")

        assert response.status_code == HTTPStatus.CREATED
        assert response.data["pid"].startswith("tm_")
        # camelCase in -> snake_case persisted.
        assert Team.objects.get(name="Harbor City FC").short_name == "Harbor City"

    def test_admin_can_update_team(self, admin_client: APIClient):
        team = TeamFactory()

        response = admin_client.patch(
            reverse("api:team-detail", args=[team.pid]),
            {"city": "Newport"},
            format="json",
        )

        assert response.status_code == HTTPStatus.OK
        team.refresh_from_db()
        assert team.city == "Newport"

    def test_admin_can_delete_team(self, admin_client: APIClient):
        team = TeamFactory()

        response = admin_client.delete(reverse("api:team-detail", args=[team.pid]))

        assert response.status_code == HTTPStatus.NO_CONTENT
        assert not Team.objects.filter(pk=team.pk).exists()


class TestPlayerViewSet:
    def test_filter_players_by_team(self, api_client: APIClient):
        team = TeamFactory()
        PlayerFactory(team=team)
        PlayerFactory(team=TeamFactory())

        response = api_client.get(reverse("api:player-list"), {"team": team.pid})

        assert response.status_code == HTTPStatus.OK
        assert response.data["count"] == 1

    def test_squad_ordered_by_position_then_number(self, api_client: APIClient):
        team = TeamFactory()
        PlayerFactory(team=team, position=Position.FORWARD, number=9)
        PlayerFactory(team=team, position=Position.GOALKEEPER, number=1)
        PlayerFactory(team=team, position=Position.DEFENDER, number=4)

        response = api_client.get(reverse("api:player-list"), {"team": team.pid})

        positions = [row["position"] for row in response.data["results"]]
        assert positions == [Position.GOALKEEPER, Position.DEFENDER, Position.FORWARD]

    def test_admin_can_create_player(self, admin_client: APIClient):
        team = TeamFactory()
        payload = {
            "team": team.pid,
            "name": "M. Okafor",
            "number": 10,
            "position": Position.MIDFIELDER,
        }

        response = admin_client.post(reverse("api:player-list"), payload, format="json")

        assert response.status_code == HTTPStatus.CREATED
        assert response.data["pid"].startswith("pl_")
        assert Player.objects.get(pid=response.data["pid"]).team == team

    def test_anonymous_cannot_create_player(self, api_client: APIClient):
        team = TeamFactory()

        response = api_client.post(
            reverse("api:player-list"),
            {"team": team.pid, "name": "M. Okafor", "position": Position.MIDFIELDER},
            format="json",
        )

        assert response.status_code == HTTPStatus.UNAUTHORIZED
