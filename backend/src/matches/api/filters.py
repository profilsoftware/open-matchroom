from django_filters import rest_framework as filters

from src.matches.models import Match


class MatchFilter(filters.FilterSet):
    """Scope the fixture list by status and/or round (e.g. ``?round=Matchday 28``)."""

    round = filters.CharFilter(field_name="round", lookup_expr="icontains")

    class Meta:
        model = Match
        fields = ["status", "round"]
