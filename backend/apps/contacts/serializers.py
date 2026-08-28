import json

from django.contrib.contenttypes.models import ContentType
from django.http import QueryDict
from django_countries.serializers import CountryFieldMixin
from rest_framework import serializers

from apps.clubs.models import Club
from apps.locations.serializers import CitySerializer
from apps.players.serializers import PlayerProfileSerializer, PlayerProfileWriteSerializer

from .models import Person, Relationship, RelationshipType


class PersonMiniSerializer(serializers.ModelSerializer):
    """Compact representation used when a Person is embedded elsewhere
    (as current_club's staff, as referred_by, inside a relationship, etc.)"""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Person
        fields = ["id", "full_name", "category", "photo", "role_title"]


class ClubMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ["id", "name", "crest", "country"]


class PersonListSerializer(CountryFieldMixin, serializers.ModelSerializer):
    """Trimmed-down shape for list/search results, matching section 16's
    card requirements without shipping the full detail payload."""

    full_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(read_only=True)
    current_club_detail = ClubMiniSerializer(source="current_club", read_only=True)
    primary_position = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = [
            "id", "full_name", "nickname", "photo", "category", "age",
            "nationality", "current_country", "current_club_detail",
            "role_title", "is_favorite", "primary_position", "status",
        ]

    def get_primary_position(self, obj):
        profile = getattr(obj, "player_profile", None)
        return profile.primary_position.name if profile else None

    def get_status(self, obj):
        profile = getattr(obj, "player_profile", None)
        return profile.status.name if profile else None


class PersonDetailSerializer(CountryFieldMixin, serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(read_only=True)
    last_contact_date = serializers.DateField(read_only=True)
    current_city_detail = CitySerializer(source="current_city", read_only=True)
    current_club_detail = ClubMiniSerializer(source="current_club", read_only=True)
    referred_by_detail = PersonMiniSerializer(source="referred_by", read_only=True)
    player_profile = PlayerProfileSerializer(read_only=True)

    class Meta:
        model = Person
        fields = [
            "id", "first_name", "last_name", "nickname", "full_name", "photo",
            "category", "birth_date", "age", "nationality", "current_country",
            "current_city", "current_city_detail", "phone", "whatsapp", "email",
            "instagram", "current_club", "current_club_detail", "role_title",
            "is_favorite", "notes", "how_met", "referred_by", "referred_by_detail",
            "relationship_level", "last_contact_date", "player_profile",
            "created_at", "updated_at",
        ]


class PersonWriteSerializer(CountryFieldMixin, serializers.ModelSerializer):
    """
    Handles create/update for every category. The frontend only sends the
    fields relevant to the chosen category (the form adapts per section 8),
    and player_profile is accepted as a nested payload that we upsert
    alongside the Person in a single request/transaction.
    """

    player_profile = PlayerProfileWriteSerializer(required=False, allow_null=True)

    def to_internal_value(self, data):
        # Multipart requests (needed for the photo upload) can't carry a
        # nested object natively, so the frontend sends player_profile as a
        # JSON-encoded string in that case; decode it before validation.
        raw_profile = data.get("player_profile") if hasattr(data, "get") else None
        if isinstance(raw_profile, str):
            parsed = None
            if raw_profile:
                try:
                    parsed = json.loads(raw_profile)
                except ValueError:
                    parsed = raw_profile  # let the nested serializer reject it normally
            if isinstance(data, QueryDict):
                # A QueryDict is treated by DRF as "HTML form input": nested
                # Serializer fields special-case that and try to rebuild the
                # nested object from flattened `player_profile.<field>` keys
                # via html.parse_html_dict, ignoring a plain dict value we'd
                # assign here. Rebuilding as an ordinary dict (one value per
                # key, files included) makes DRF treat it as regular
                # JSON-shaped input so our parsed dict is used as-is.
                data = {key: data.get(key) for key in data}
            data["player_profile"] = parsed
        return super().to_internal_value(data)

    class Meta:
        model = Person
        fields = [
            "id", "first_name", "last_name", "nickname", "photo", "category",
            "birth_date", "nationality", "current_country", "current_city",
            "phone", "whatsapp", "email", "instagram", "current_club",
            "role_title", "is_favorite", "notes", "how_met", "referred_by",
            "relationship_level", "player_profile",
        ]

    def validate(self, attrs):
        if not attrs.get("first_name") and not self.partial:
            raise serializers.ValidationError({"first_name": "El nombre es obligatorio."})
        category = attrs.get("category", getattr(self.instance, "category", None))
        player_profile = attrs.get("player_profile")
        if category not in (Person.Category.PLAYER, Person.Category.EX_PLAYER) and player_profile:
            raise serializers.ValidationError(
                {"player_profile": "Solo los jugadores pueden tener ficha de jugador."}
            )
        return attrs

    def create(self, validated_data):
        profile_data = validated_data.pop("player_profile", None)
        person = Person.objects.create(**validated_data)
        if profile_data and person.category in (Person.Category.PLAYER, Person.Category.EX_PLAYER):
            PlayerProfileWriteSerializer().create({**profile_data, "person": person})
        return person

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("player_profile", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if instance.category in (Person.Category.PLAYER, Person.Category.EX_PLAYER):
            if profile_data:
                profile = getattr(instance, "player_profile", None)
                if profile:
                    PlayerProfileWriteSerializer().update(profile, profile_data)
                else:
                    PlayerProfileWriteSerializer().create({**profile_data, "person": instance})
        return instance


class RelationshipTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RelationshipType
        fields = ["id", "code", "label", "inverse_label"]


ENTITY_MODEL_MAP = {"person": Person, "club": Club}


def serialize_entity(entity):
    if isinstance(entity, Person):
        return {"type": "person", **PersonMiniSerializer(entity).data}
    if isinstance(entity, Club):
        return {"type": "club", **ClubMiniSerializer(entity).data}
    return None


class RelationshipSerializer(serializers.ModelSerializer):
    relationship_type_detail = RelationshipTypeSerializer(source="relationship_type", read_only=True)
    from_entity_detail = serializers.SerializerMethodField()
    to_entity_detail = serializers.SerializerMethodField()
    from_type = serializers.ChoiceField(choices=list(ENTITY_MODEL_MAP), write_only=True)
    to_type = serializers.ChoiceField(choices=list(ENTITY_MODEL_MAP), write_only=True)
    from_id = serializers.UUIDField(write_only=True)
    to_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Relationship
        fields = [
            "id", "relationship_type", "relationship_type_detail", "notes",
            "from_type", "from_id", "to_type", "to_id",
            "from_entity_detail", "to_entity_detail", "created_at",
        ]

    def get_from_entity_detail(self, obj):
        return serialize_entity(obj.from_entity)

    def get_to_entity_detail(self, obj):
        return serialize_entity(obj.to_entity)

    def _resolve(self, type_key, obj_id):
        model = ENTITY_MODEL_MAP[type_key]
        try:
            instance = model.objects.get(pk=obj_id, owner=self.context["request"].user)
        except model.DoesNotExist:
            raise serializers.ValidationError("La entidad relacionada no existe.")
        return ContentType.objects.get_for_model(model), instance.pk

    def create(self, validated_data):
        from_ct, from_id = self._resolve(validated_data.pop("from_type"), validated_data.pop("from_id"))
        to_ct, to_id = self._resolve(validated_data.pop("to_type"), validated_data.pop("to_id"))
        return Relationship.objects.create(
            owner=self.context["request"].user,
            from_content_type=from_ct, from_object_id=from_id,
            to_content_type=to_ct, to_object_id=to_id,
            **validated_data,
        )
