from rest_framework.routers import DefaultRouter

from .views import PlayerSearchViewSet, PlayerStatusViewSet, PositionViewSet

router = DefaultRouter()
router.register("players", PlayerSearchViewSet, basename="player-search")
router.register("positions", PositionViewSet, basename="position")
router.register("player-statuses", PlayerStatusViewSet, basename="player-status")

urlpatterns = router.urls
