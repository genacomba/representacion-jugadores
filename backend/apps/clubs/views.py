from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.contacts.models import Person, Relationship
from apps.contacts.serializers import PersonListSerializer, RelationshipSerializer
from apps.core.models import RecentView

from .models import Club
from .serializers import ClubDetailSerializer, ClubListSerializer, ClubWriteSerializer


class ClubViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self):
        qs = Club.objects.filter(owner=self.request.user).select_related("city")
        is_favorite = self.request.query_params.get("is_favorite")
        if is_favorite is not None:
            qs = qs.filter(is_favorite=is_favorite.lower() in ("1", "true"))
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return ClubListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ClubWriteSerializer
        return ClubDetailSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        RecentView.touch(request.user, instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def toggle_favorite(self, request, pk=None):
        club = self.get_object()
        club.is_favorite = not club.is_favorite
        club.save(update_fields=["is_favorite"])
        return Response({"is_favorite": club.is_favorite})

    @action(detail=True, methods=["get"])
    def people(self, request, pk=None):
        """People from the agenda related to this club: staff currently
        working there (current_club) plus players whose player_profile
        points at it via current_club too — surfaced together per
        section 10's "visualizar las personas de mi agenda relacionadas"."""
        club = self.get_object()
        qs = Person.objects.filter(owner=request.user, current_club=club).select_related(
            "player_profile__primary_position", "player_profile__status"
        )
        return Response(PersonListSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def relationships(self, request, pk=None):
        club = self.get_object()
        ct = ContentType.objects.get_for_model(Club)
        qs = Relationship.objects.filter(owner=request.user).filter(
            Q(from_content_type=ct, from_object_id=club.pk)
            | Q(to_content_type=ct, to_object_id=club.pk)
        ).select_related("relationship_type")
        return Response(RelationshipSerializer(qs, many=True, context={"request": request}).data)
