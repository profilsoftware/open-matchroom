from django.contrib import admin

from src.matches.models import Event
from src.matches.models import Match
from src.matches.models import PlayerPositionInMatch
from src.matches.models import TeamStatsInMatch


class TeamStatsInline(admin.TabularInline):
    model = TeamStatsInMatch
    extra = 0
    autocomplete_fields = ["team"]


class PlayerPositionInline(admin.TabularInline):
    model = PlayerPositionInMatch
    extra = 0
    fields = ["team", "player", "role", "order", "position"]
    autocomplete_fields = ["team", "player"]


class EventInline(admin.TabularInline):
    model = Event
    extra = 0
    fields = [
        "minute",
        "type",
        "side",
        "primary_player",
        "secondary_player",
        "is_major",
        "text",
    ]
    autocomplete_fields = ["primary_player", "secondary_player"]


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = [
        "__str__",
        "competition",
        "round",
        "status",
        "current_minute",
        "home_score",
        "away_score",
        "kickoff_at",
    ]
    list_filter = ["status", "competition"]
    search_fields = [
        "home_team__name",
        "away_team__name",
        "competition",
        "round",
        "venue",
    ]
    list_select_related = ["home_team", "away_team"]
    autocomplete_fields = ["home_team", "away_team"]
    inlines = [TeamStatsInline, PlayerPositionInline, EventInline]


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ["match", "minute", "type", "side", "primary_player", "is_major"]
    list_filter = ["type", "side", "is_major"]
    search_fields = ["match__home_team__name", "match__away_team__name", "text"]
    list_select_related = ["match", "primary_player"]
    autocomplete_fields = ["match", "primary_player", "secondary_player"]
