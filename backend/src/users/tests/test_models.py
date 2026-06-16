from __future__ import annotations

import pytest

from src.users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db

PID_TOKEN_LENGTH = 12


class TestUserModel:
    def test_pid_assigned_with_prefix(self):
        user = UserFactory()

        assert user.pid.startswith("us_")
        assert len(user.pid) == len("us_") + PID_TOKEN_LENGTH

    def test_pids_are_unique(self):
        first = UserFactory()
        second = UserFactory()

        assert first.pid != second.pid

    def test_str_is_email(self):
        user = UserFactory(email="coach@club.example")

        assert str(user) == "coach@club.example"
