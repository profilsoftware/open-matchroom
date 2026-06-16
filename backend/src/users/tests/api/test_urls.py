from __future__ import annotations

from django.urls import resolve
from django.urls import reverse


def test_me_url():
    assert reverse("api:users:user-me") == "/api/users/me/"
    assert resolve("/api/users/me/").view_name == "api:users:user-me"


def test_auth_urls():
    assert reverse("api:login") == "/api/auth/login/"
    assert reverse("api:refresh") == "/api/auth/token/refresh/"
    assert reverse("api:logout") == "/api/auth/logout/"
