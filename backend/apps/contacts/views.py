from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.models import RecentView

from .filters import PersonFilter
from .models import Person, Relationship, RelationshipType
from .serializers import (
    PersonDetailSerializer,
    PersonListSerializer,
    PersonWriteSerializer,
    RelationshipSerializer,
    RelationshipTypeSerializer,
)


class PersonViewSet(viewsets.ModelViewSet):
    """Exact-facet filtering (category, favorite, club, nationality). For
    cross-field free-text search see apps.search."""

    filterset_class = PersonFilter

    def get_queryset(self):
        return (
            Person.objects.filter(owner=self.request.user)
            .select_related("current_club", "current_city", "referred_by")
            .select_related("player_profile__primary_position", "player_profile__status")
        )

    def get_serializer_class(self):
        if self.action == "list":
            return PersonListSerializer
        if self.action in ("create", "update", "partial_update"):
            return PersonWriteSerializer
        return PersonDetailSerializer

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "request": self.request}

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        RecentView.touch(request.user, instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def toggle_favorite(self, request, pk=None):
        person = self.get_object()
        person.is_favorite = not person.is_favorite
        person.save(update_fields=["is_favorite"])
        return Response({"is_favorite": person.is_favorite})

    @action(detail=True, methods=["get"])
    def relationships(self, request, pk=None):
        person = self.get_object()
        ct = ContentType.objects.get_for_model(Person)
        qs = Relationship.objects.filter(owner=request.user).filter(
            Q(from_content_type=ct, from_object_id=person.pk)
            | Q(to_content_type=ct, to_object_id=person.pk)
        ).select_related("relationship_type")
        return Response(RelationshipSerializer(qs, many=True, context={"request": request}).data)


class RelationshipTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RelationshipType.objects.all()
    serializer_class = RelationshipTypeSerializer
    pagination_class = None


class RelationshipViewSet(viewsets.ModelViewSet):
    serializer_class = RelationshipSerializer

    def get_queryset(self):
        return Relationship.objects.filter(owner=self.request.user).select_related("relationship_type")

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "request": self.request}
