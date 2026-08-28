from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.locations.views import CountryListView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.contacts.urls")),
    path("api/", include("apps.clubs.urls")),
    path("api/", include("apps.players.urls")),
    path("api/", include("apps.interactions.urls")),
    path("api/", include("apps.resources.urls")),
    path("api/locations/", include("apps.locations.urls")),
    path("api/locations/countries/", CountryListView.as_view(), name="country-list"),
    path("api/search/", include("apps.search.urls")),
    path("api/map/", include("apps.mapdata.urls")),
    path("api/", include("apps.core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
