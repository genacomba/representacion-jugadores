from rest_framework import viewsets

from apps.contacts.models import Person
from apps.contacts.serializers import PersonListSerializer

from .filters import PlayerSearchFilter
from .models import PlayerStatus, Position
from .serializers import PlayerStatusSerializer, PositionSerializer


class PositionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    pagination_class = None


class PlayerStatusViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PlayerStatus.objects.all()
    serializer_class = PlayerStatusSerializer
    pagination_class = None


class PlayerSearchViewSet(viewsets.ReadOnlyModelViewSet):
    """Powers "Necesito un jugador" (section 14): every registered player,
    filterable and combinable via query params."""

    serializer_class = PersonListSerializer
    filterset_class = PlayerSearchFilter

    def get_queryset(self):
        return (
            Person.objects.filter(owner=self.request.user, player_profile__isnull=False)
            .select_related(
                "current_club", "player_profile__primary_position", "player_profile__status"
            )
        )
