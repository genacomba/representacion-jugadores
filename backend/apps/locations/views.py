from django_countries import countries
from rest_framework import mixins, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import City
from .serializers import CitySerializer


class CityViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.RetrieveModelMixin,
                   viewsets.GenericViewSet):
    """
    Read/typeahead access to the shared city reference table, plus the
    ability to add a new city inline from a contact/club form when it is
    missing from the dataset (see City model docstring for the tradeoff).
    """

    queryset = City.objects.all()
    serializer_class = CitySerializer
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        country = self.request.query_params.get("country")
        if country:
            qs = qs.filter(country=country)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs[:30]


class CountryListView(APIView):
    """Structured, translation-free list of countries for select inputs."""

    def get(self, request):
        data = [{"code": code, "name": name} for code, name in countries]
        data.sort(key=lambda c: c["name"])
        return Response(data)
