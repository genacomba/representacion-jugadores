from django.contrib.contenttypes.models import ContentType
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.clubs.models import Club
from apps.clubs.serializers import ClubListSerializer
from apps.contacts.models import Person
from apps.contacts.serializers import PersonListSerializer

from .models import RecentView


class DashboardView(APIView):
    """
    Backs the Home screen (section 15): favorites, recently opened
    contacts, and players currently in a negotiation-like status, all in
    one round trip so the app feels instant on open.
    """

    def get(self, request):
        owner = request.user

        favorite_people = Person.objects.filter(owner=owner, is_favorite=True).select_related(
            "current_club", "player_profile__primary_position", "player_profile__status"
        )[:12]
        favorite_clubs = Club.objects.filter(owner=owner, is_favorite=True)[:12]

        person_ct = ContentType.objects.get_for_model(Person)
        club_ct = ContentType.objects.get_for_model(Club)
        recent_views = RecentView.objects.filter(owner=owner)[:10]

        recent_people_ids = [rv.object_id for rv in recent_views if rv.content_type_id == person_ct.id]
        recent_club_ids = [rv.object_id for rv in recent_views if rv.content_type_id == club_ct.id]
        recent_people = {p.id: p for p in Person.objects.filter(id__in=recent_people_ids)}
        recent_clubs = {c.id: c for c in Club.objects.filter(id__in=recent_club_ids)}

        recent = []
        for rv in recent_views:
            if rv.content_type_id == person_ct.id and rv.object_id in recent_people:
                recent.append({"type": "person", **PersonListSerializer(recent_people[rv.object_id]).data})
            elif rv.content_type_id == club_ct.id and rv.object_id in recent_clubs:
                recent.append({"type": "club", **ClubListSerializer(recent_clubs[rv.object_id]).data})

        in_negotiation = Person.objects.filter(
            owner=owner,
            player_profile__status__code__in=["offered", "negotiating"],
        ).select_related("current_club", "player_profile__primary_position", "player_profile__status")[:12]

        category_counts = {
            choice[0]: Person.objects.filter(owner=owner, category=choice[0]).count()
            for choice in Person.Category.choices
        }
        category_counts["club"] = Club.objects.filter(owner=owner).count()

        return Response({
            "favorite_people": PersonListSerializer(favorite_people, many=True).data,
            "favorite_clubs": ClubListSerializer(favorite_clubs, many=True).data,
            "recent": recent,
            "in_negotiation": PersonListSerializer(in_negotiation, many=True).data,
            "category_counts": category_counts,
        })
