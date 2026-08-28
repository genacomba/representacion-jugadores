from rest_framework.response import Response
from rest_framework.views import APIView

from apps.clubs.serializers import ClubListSerializer
from apps.contacts.serializers import PersonListSerializer

from .services import search_clubs, search_people


class GlobalSearchView(APIView):
    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response({"query": "", "people": [], "clubs": []})

        people = search_people(request.user, query)[:50]
        clubs = search_clubs(request.user, query)[:50]

        return Response({
            "query": query,
            "people": PersonListSerializer(people, many=True).data,
            "clubs": ClubListSerializer(clubs, many=True).data,
        })
