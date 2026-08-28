from rest_framework.routers import DefaultRouter

from .views import PersonViewSet, RelationshipTypeViewSet, RelationshipViewSet

router = DefaultRouter()
router.register("people", PersonViewSet, basename="person")
router.register("relationships", RelationshipViewSet, basename="relationship")
router.register("relationship-types", RelationshipTypeViewSet, basename="relationship-type")

urlpatterns = router.urls
