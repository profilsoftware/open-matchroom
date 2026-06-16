from rest_framework import serializers

from src.teams.models import Player
from src.teams.models import Team


class TeamSerializer(serializers.ModelSerializer):
    """Club details (branding). Squad is managed via the player endpoint."""

    class Meta:
        model = Team
        fields = [
            "pid",
            "name",
            "short_name",
            "abbreviation",
            "city",
            "color",
            "logo",
        ]
        read_only_fields = ["pid"]


class PlayerSerializer(serializers.ModelSerializer):
    """A squad member; ``team`` is referenced by its public id."""

    team = serializers.SlugRelatedField(
        slug_field="pid",
        queryset=Team.objects.all(),
    )

    class Meta:
        model = Player
        fields = ["pid", "team", "name", "number", "position", "photo"]
        read_only_fields = ["pid"]
