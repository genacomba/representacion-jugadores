from django.contrib import admin

from .models import Club


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ["name", "country", "city", "owner", "is_favorite"]
    list_filter = ["country", "is_favorite"]
    search_fields = ["name"]
