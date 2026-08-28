from django_countries.serializers import CountryFieldMixin
from rest_framework import serializers

from .models import City


class CitySerializer(CountryFieldMixin, serializers.ModelSerializer):
    country_name = serializers.CharField(source="country.name", read_only=True)

    class Meta:
        model = City
        fields = [
            "id", "name", "country", "country_name", "admin_area",
            "latitude", "longitude", "has_coordinates",
        ]
        read_only_fields = ["latitude", "longitude"]

    def validate(self, attrs):
        name = attrs.get("name", "").strip()
        if not name:
            raise serializers.ValidationError({"name": "La ciudad es obligatoria."})
        attrs["name"] = name
        return attrs
