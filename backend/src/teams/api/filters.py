from django_filters import rest_framework as filters

from src.teams.models import Player


class PlayerFilter(filters.FilterSet):
    """Scope the squad list by team (public id) and/or position."""

    team = filters.CharFilter(field_name="team__pid", lookup_expr="exact")

    class Meta:
        model = Player
        fields = ["team", "position"]
