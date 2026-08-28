from rest_framework import serializers

from .models import PlayerProfile, PlayerStatus, Position


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = ["id", "code", "name"]


class PlayerStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlayerStatus
        fields = ["id", "code", "name"]


class RepresentativeMiniSerializer(serializers.Serializer):
    """
    Deliberately not imported from apps.contacts.serializers: that module
    imports this file to embed a player profile inside a Person, so a
    reverse import here would create a cycle. Kept intentionally tiny.
    """

    id = serializers.UUIDField()
    full_name = serializers.CharField()
    phone = serializers.CharField()
    whatsapp = serializers.CharField()


class PlayerProfileSerializer(serializers.ModelSerializer):
    primary_position_detail = PositionSerializer(source="primary_position", read_only=True)
    secondary_position_detail = PositionSerializer(source="secondary_position", read_only=True)
    status_detail = PlayerStatusSerializer(source="status", read_only=True)
    represented_by_detail = serializers.SerializerMethodField()
    age = serializers.IntegerField(read_only=True)

    class Meta:
        model = PlayerProfile
        fields = [
            "primary_position", "primary_position_detail",
            "secondary_position", "secondary_position_detail",
            "preferred_foot", "has_eu_passport", "contract_until",
            "represented_by", "represented_by_detail",
            "status", "status_detail", "age",
        ]

    def get_represented_by_detail(self, obj):
        if not obj.represented_by:
            return None
        rep = obj.represented_by
        return RepresentativeMiniSerializer({
            "id": rep.id, "full_name": rep.full_name,
            "phone": rep.phone, "whatsapp": rep.whatsapp,
        }).data


class PlayerProfileWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlayerProfile
        fields = [
            "primary_position", "secondary_position", "preferred_foot",
            "has_eu_passport", "contract_until", "represented_by", "status",
        ]

    def create(self, validated_data):
        person = validated_data.pop("person")
        return PlayerProfile.objects.create(person=person, **validated_data)
