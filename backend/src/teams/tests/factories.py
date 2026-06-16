from __future__ import annotations

from factory import Faker
from factory import SubFactory
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyChoice

from src.teams.models import Player
from src.teams.models import Position
from src.teams.models import Team


class TeamFactory(DjangoModelFactory[Team]):
    name = Faker("company")
    short_name = Faker("city")
    abbreviation = Faker("lexify", text="???")
    city = Faker("city")
    color = "#2f6ca8"

    class Meta:
        model = Team


class PlayerFactory(DjangoModelFactory[Player]):
    team = SubFactory(TeamFactory)
    name = Faker("name")
    number = Faker("random_int", min=1, max=99)
    position = FuzzyChoice(Position.values)

    class Meta:
        model = Player
