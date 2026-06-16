from django.contrib import admin

from src.teams.models import Player
from src.teams.models import Team


class PlayerInline(admin.TabularInline):
    model = Player
    extra = 0
    fields = ["number", "name", "position", "photo"]


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ["name", "short_name", "abbreviation", "city", "color"]
    search_fields = ["name", "short_name", "abbreviation", "city"]
    inlines = [PlayerInline]


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ["name", "team", "number", "position"]
    list_filter = ["position", "team"]
    search_fields = ["name"]
    list_select_related = ["team"]
