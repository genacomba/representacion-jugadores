from django.contrib import admin

from .models import City


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ["name", "country", "admin_area", "latitude", "longitude"]
    list_filter = ["country"]
    search_fields = ["name"]
