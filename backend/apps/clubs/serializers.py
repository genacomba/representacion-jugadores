from django_countries.serializers import CountryFieldMixin
from rest_framework import serializers

from apps.locations.serializers import CitySerializer

from .models import Club


class ClubListSerializer(CountryFieldMixin, serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ["id", "name", "crest", "country", "is_favorite"]


class ClubDetailSerializer(CountryFieldMixin, serializers.ModelSerializer):
    city_detail = CitySerializer(source="city", read_only=True)
    last_contact_date = serializers.DateField(read_only=True)

    class Meta:
        model = Club
        fields = [
            "id", "name", "crest", "country", "city", "city_detail",
            "website", "notes", "is_favorite", "last_contact_date",
            "created_at", "updated_at",
        ]


class ClubWriteSerializer(CountryFieldMixin, serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ["id", "name", "crest", "country", "city", "website", "notes", "is_favorite"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("El nombre del club es obligatorio.")
        return value
