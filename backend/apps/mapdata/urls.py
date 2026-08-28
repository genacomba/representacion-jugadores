from django.urls import path

from .views import MapCitiesView, MapCityEntitiesView

urlpatterns = [
    path("cities/", MapCitiesView.as_view(), name="map-cities"),
    path("cities/<int:city_id>/entities/", MapCityEntitiesView.as_view(), name="map-city-entities"),
]
