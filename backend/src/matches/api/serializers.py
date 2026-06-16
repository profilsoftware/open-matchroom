from rest_framework import serializers

from src.matches.models import Event
from src.matches.models import Match
from src.matches.models import PlayerPositionInMatch
from src.matches.models import TeamStatsInMatch
from src.matches.services import scoreboard
from src.teams.models import Player
from src.teams.models import Team
from src.teams.services import squad


class TeamBriefSerializer(serializers.ModelSerializer):
    """Club branding embedded in match payloads (crest colour falls back)."""

    color = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ["pid", "name", "short_name", "abbreviation", "color", "logo"]

    def get_color(self, team: Team) -> str:
        return squad.crest_color(team)


class EventSerializer(serializers.ModelSerializer):
    """A timeline event; players are referenced by public id, names echoed back."""

    primary_player = serializers.SlugRelatedField(
        slug_field="pid",
        queryset=Player.objects.all(),
        required=False,
        allow_null=True,
    )
    secondary_player = serializers.SlugRelatedField(
        slug_field="pid",
        queryset=Player.objects.all(),
        required=False,
        allow_null=True,
    )
    primary_player_name = serializers.CharField(
        source="primary_player.name",
        read_only=True,
        default=None,
    )
    secondary_player_name = serializers.CharField(
        source="secondary_player.name",
        read_only=True,
        default=None,
    )

    class Meta:
        model = Event
        fields = [
            "pid",
            "side",
            "type",
            "primary_player",
            "secondary_player",
            "primary_player_name",
            "secondary_player_name",
            "minute",
            "text",
            "is_major",
        ]
        read_only_fields = ["pid"]


class TeamStatsSerializer(serializers.ModelSerializer):
    """The count metrics for one side (no pid/team — keyed by side in payload)."""

    class Meta:
        model = TeamStatsInMatch
        fields = [
            "possession",
            "total_shots",
            "shots_on_target",
            "corners",
            "fouls",
            "offsides",
            "yellow_cards",
            "red_cards",
        ]


class LineupPlayerSerializer(serializers.ModelSerializer):
    """A positioned player in a lineup (the frontend derives the pitch x/y)."""

    player = serializers.SlugRelatedField(slug_field="pid", read_only=True)
    name = serializers.CharField(source="player.name", read_only=True)
    number = serializers.IntegerField(source="player.number", read_only=True)

    class Meta:
        model = PlayerPositionInMatch
        fields = ["player", "name", "number", "position", "role", "order"]


class MatchCardSerializer(serializers.ModelSerializer):
    """Compact fixture row for the schedule (`list`)."""

    home_team = TeamBriefSerializer(read_only=True)
    away_team = TeamBriefSerializer(read_only=True)

    class Meta:
        model = Match
        fields = [
            "pid",
            "competition",
            "round",
            "venue",
            "kickoff_at",
            "status",
            "minute",
            "home_score",
            "away_score",
            "home_penalty_score",
            "away_penalty_score",
            "home_team",
            "away_team",
        ]


class MatchroomSerializer(serializers.ModelSerializer):
    """Full match-center payload the frontend viewer consumes (`retrieve`)."""

    home_team = TeamBriefSerializer(read_only=True)
    away_team = TeamBriefSerializer(read_only=True)
    events = EventSerializer(many=True, read_only=True)
    lineup = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    scorers = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            "pid",
            "competition",
            "round",
            "venue",
            "kickoff_at",
            "status",
            "minute",
            "home_score",
            "away_score",
            "home_penalty_score",
            "away_penalty_score",
            "home_formation",
            "away_formation",
            "home_team",
            "away_team",
            "lineup",
            "stats",
            "scorers",
            "events",
        ]

    def _side_lineup(self, positions: list[PlayerPositionInMatch]) -> dict:
        return {
            "starters": LineupPlayerSerializer(
                [p for p in positions if p.role == PlayerPositionInMatch.Role.STARTER],
                many=True,
            ).data,
            "subs": LineupPlayerSerializer(
                [
                    p
                    for p in positions
                    if p.role == PlayerPositionInMatch.Role.SUBSTITUTE
                ],
                many=True,
            ).data,
        }

    def get_lineup(self, match: Match) -> dict:
        positions = list(match.player_positions.all())
        return {
            "home": self._side_lineup(
                [p for p in positions if p.team_id == match.home_team_id],
            ),
            "away": self._side_lineup(
                [p for p in positions if p.team_id == match.away_team_id],
            ),
        }

    def get_stats(self, match: Match) -> dict:
        by_team = {s.team_id: s for s in match.team_stats.all()}
        home = by_team.get(match.home_team_id)
        away = by_team.get(match.away_team_id)
        return {
            "home": TeamStatsSerializer(home).data if home else None,
            "away": TeamStatsSerializer(away).data if away else None,
        }

    def get_scorers(self, match: Match) -> list[dict]:
        return scoreboard.goal_scorers(match)


class MatchWriteSerializer(serializers.ModelSerializer):
    """Match details CRUD; teams referenced by public id."""

    home_team = serializers.SlugRelatedField(
        slug_field="pid",
        queryset=Team.objects.all(),
    )
    away_team = serializers.SlugRelatedField(
        slug_field="pid",
        queryset=Team.objects.all(),
    )

    class Meta:
        model = Match
        fields = [
            "pid",
            "home_team",
            "away_team",
            "competition",
            "round",
            "venue",
            "kickoff_at",
            "status",
            "minute",
            "home_score",
            "away_score",
            "home_penalty_score",
            "away_penalty_score",
            "home_formation",
            "away_formation",
        ]
        read_only_fields = ["pid"]


class LineupWriteSerializer(serializers.Serializer):
    """Input for the `lineup` action: a side, formation, and ordered pids."""

    side = serializers.ChoiceField(choices=Event.Side.choices)
    formation = serializers.CharField(required=False, allow_blank=True, default="")
    starters = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )
    subs = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )


class TeamStatsWriteSerializer(serializers.ModelSerializer):
    """Input for the `team-stats` action: a team pid plus the count metrics."""

    team = serializers.SlugRelatedField(slug_field="pid", queryset=Team.objects.all())

    class Meta:
        model = TeamStatsInMatch
        fields = [
            "team",
            "possession",
            "total_shots",
            "shots_on_target",
            "corners",
            "fouls",
            "offsides",
            "yellow_cards",
            "red_cards",
        ]
