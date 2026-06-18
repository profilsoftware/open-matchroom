from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from src.matches.api.filters import MatchFilter
from src.matches.api.serializers import ClockActionSerializer
from src.matches.api.serializers import EventSerializer
from src.matches.api.serializers import LineupWriteSerializer
from src.matches.api.serializers import MatchCardSerializer
from src.matches.api.serializers import MatchroomSerializer
from src.matches.api.serializers import MatchWriteSerializer
from src.matches.api.serializers import TeamStatsSerializer
from src.matches.api.serializers import TeamStatsWriteSerializer
from src.matches.models import Event
from src.matches.models import Match
from src.matches.models import PlayerPositionInMatch
from src.matches.models import TeamStatsInMatch
from src.matches.services import clock
from src.matches.services import events
from src.matches.services import lineup
from src.matches.services import stats


def _matchroom_queryset():
    """Match queryset with everything the matchroom payload needs prefetched."""
    return Match.objects.select_related("home_team", "away_team").prefetch_related(
        Prefetch(
            "player_positions",
            queryset=PlayerPositionInMatch.objects.select_related("player"),
        ),
        Prefetch(
            "events",
            queryset=Event.objects.select_related("primary_player", "secondary_player"),
        ),
        Prefetch(
            "team_stats",
            queryset=TeamStatsInMatch.objects.select_related("team"),
        ),
    )


class MatchViewSet(viewsets.ModelViewSet):
    """Fixtures: compact cards on `list`, full matchroom on `retrieve`.

    Lineups and per-team stats are edited through dedicated actions; events live
    under the nested ``MatchEventViewSet``. Public reads, authenticated writes.
    """

    lookup_field = "pid"
    filter_backends = [DjangoFilterBackend]
    filterset_class = MatchFilter

    def get_queryset(self):
        if self.action == "retrieve":
            return _matchroom_queryset()
        return Match.objects.select_related("home_team", "away_team")

    def get_serializer_class(self):
        if self.action == "list":
            return MatchCardSerializer
        if self.action == "retrieve":
            return MatchroomSerializer
        return MatchWriteSerializer

    def _matchroom_response(self, match: Match) -> Response:
        match = _matchroom_queryset().get(pk=match.pk)
        serializer = MatchroomSerializer(match, context=self.get_serializer_context())
        return Response(serializer.data)

    @action(detail=True, methods=["put"])
    def lineup(self, request, pid=None):
        match = self.get_object()
        serializer = LineupWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        lineup.set_lineup(
            match,
            side=data["side"],
            formation=data["formation"],
            starter_ids=data["starters"],
            sub_ids=data["subs"],
        )
        return self._matchroom_response(match)

    @action(detail=True, methods=["post"])
    def clock(self, request, pid=None):
        match = self.get_object()
        serializer = ClockActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        op = data["action"]
        if op == "start":
            clock.start(match)
        elif op == "pause":
            clock.pause(match)
        elif op == "finish":
            clock.finish(match)
        elif op == "set":
            clock.set_minute(match, data["minute"])
        return self._matchroom_response(match)

    @action(detail=True, methods=["put"], url_path="team-stats")
    def team_stats(self, request, pid=None):
        match = self.get_object()
        serializer = TeamStatsWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        metrics = dict(serializer.validated_data)
        team = metrics.pop("team")
        team_stats = stats.upsert_team_stats(match, team, **metrics)
        return Response(TeamStatsSerializer(team_stats).data)


class MatchEventViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Events nested under a match (`/api/matches/{match_pid}/events/`).

    Create/delete go through the events service so goals bump/revert the score.
    """

    serializer_class = EventSerializer
    lookup_field = "pid"

    def get_match(self) -> Match:
        return get_object_or_404(Match, pid=self.kwargs["match_pid"])

    def get_queryset(self):
        return Event.objects.filter(
            match__pid=self.kwargs["match_pid"],
        ).select_related("primary_player", "secondary_player")

    def create(self, request, *args, **kwargs):
        match = self.get_match()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = events.create_event(match, **serializer.validated_data)
        out = self.get_serializer(event)
        return Response(out.data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        events.delete_event(instance)
