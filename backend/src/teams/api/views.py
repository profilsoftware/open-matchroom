from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from src.teams.api.filters import PlayerFilter
from src.teams.api.serializers import PlayerSerializer
from src.teams.api.serializers import TeamSerializer
from src.teams.models import Player
from src.teams.models import Team
from src.teams.services import squad


class TeamViewSet(viewsets.ModelViewSet):
    """Club CRUD. Public reads, authenticated writes (admin console)."""

    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    lookup_field = "pid"


class PlayerViewSet(viewsets.ModelViewSet):
    """Squad CRUD, filterable by ``?team=<pid>`` / ``?position=``."""

    serializer_class = PlayerSerializer
    lookup_field = "pid"
    filter_backends = [DjangoFilterBackend]
    filterset_class = PlayerFilter

    def get_queryset(self):
        return squad.order_squad(Player.objects.select_related("team"))
