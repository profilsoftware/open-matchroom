from __future__ import annotations

from http import HTTPStatus

import pytest
from django.urls import resolve
from django.urls import reverse
from rest_framework.test import APIClient

from src.users.tests.factories import UserFactory

PASSWORD = "s3cret-matchroom-pw"  # noqa: S105

# Every request opens a transaction (ATOMIC_REQUESTS), so even the unauthenticated
# cases need DB access.
pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def auth_user(db):
    return UserFactory(email="coach@club.example", password=PASSWORD)


def login(api_client: APIClient, email: str, password: str):
    return api_client.post(
        reverse("api:login"),
        {"email": email, "password": password},
        format="json",
    )


class TestAuthFlow:
    def test_login_sets_jwt_cookies(self, api_client: APIClient, auth_user):
        response = login(api_client, auth_user.email, PASSWORD)

        assert response.status_code == HTTPStatus.OK
        assert "at" in response.cookies
        assert "rt" in response.cookies
        assert response.cookies["at"].value
        assert response.data["user"]["email"] == auth_user.email

    def test_login_rejects_bad_password(self, api_client: APIClient, auth_user):
        response = login(api_client, auth_user.email, "wrong-password")

        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert "at" not in response.cookies

    def test_login_rejects_inactive_account(self, api_client: APIClient):
        user = UserFactory(password=PASSWORD, is_active=False)

        response = login(api_client, user.email, PASSWORD)

        assert response.status_code == HTTPStatus.BAD_REQUEST

    def test_refresh_reissues_access_cookie(self, api_client: APIClient, auth_user):
        login(api_client, auth_user.email, PASSWORD)

        response = api_client.post(reverse("api:refresh"))

        assert response.status_code == HTTPStatus.OK
        assert "at" in response.cookies
        # Refresh token stays in the httpOnly cookie, never the response body.
        assert "refresh" not in response.data

    def test_logout_succeeds(self, api_client: APIClient, auth_user):
        login(api_client, auth_user.email, PASSWORD)

        response = api_client.post(reverse("api:logout"))

        assert response.status_code == HTTPStatus.OK


class TestMe:
    def test_me_returns_authenticated_user(self, api_client: APIClient, auth_user):
        login(api_client, auth_user.email, PASSWORD)

        response = api_client.get(reverse("api:users:user-me"))

        assert response.status_code == HTTPStatus.OK
        assert response.data["email"] == auth_user.email
        assert response.data["pid"].startswith("us_")

    def test_me_requires_authentication(self, api_client: APIClient):
        response = api_client.get(reverse("api:users:user-me"))

        assert response.status_code == HTTPStatus.UNAUTHORIZED


class TestUrlRouting:
    def test_me_url(self):
        assert reverse("api:users:user-me") == "/api/users/me/"
        assert resolve("/api/users/me/").view_name == "api:users:user-me"

    def test_auth_urls(self):
        assert reverse("api:login") == "/api/auth/login/"
        assert reverse("api:refresh") == "/api/auth/token/refresh/"
        assert reverse("api:logout") == "/api/auth/logout/"


class TestOpenAPISchema:
    def test_api_docs_accessible_by_admin(self, admin_client):
        url = reverse("api-docs")
        response = admin_client.get(url)
        assert response.status_code == HTTPStatus.OK

    def test_api_docs_not_accessible_by_anonymous_users(self, client):
        url = reverse("api-docs")
        response = client.get(url)
        # Cookie-JWT auth advertises a WWW-Authenticate header, so anonymous access
        # is rejected with 401 rather than 403.
        assert response.status_code == HTTPStatus.UNAUTHORIZED

    def test_api_schema_generated_successfully(self, admin_client):
        url = reverse("api-schema")
        response = admin_client.get(url)
        assert response.status_code == HTTPStatus.OK
