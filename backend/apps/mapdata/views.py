from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.locations.models import City

from .services import city_aggregates, city_entities


def _parse_categories(request):
    raw = request.query_params.get("category")
    if not raw:
        return None
    return [c for c in raw.split(",") if c]


class MapCitiesView(APIView):
    def get(self, request):
        categories = _parse_categories(request)
        return Response({"cities": city_aggregates(request.user, categories)})


class MapCityEntitiesView(APIView):
    def get(self, request, city_id):
        city = get_object_or_404(City, pk=city_id)
        categories = _parse_categories(request)
        return Response({
            "city": {"id": city.id, "name": city.name, "country_name": city.country.name},
            "entities": city_entities(request.user, city, categories),
        })
