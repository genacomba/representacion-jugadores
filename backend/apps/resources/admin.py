from django.contrib import admin

from .models import Resource


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ["title", "resource_type", "entity", "owner"]
    list_filter = ["resource_type"]
