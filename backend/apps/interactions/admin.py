from django.contrib import admin

from .models import Interaction


@admin.register(Interaction)
class InteractionAdmin(admin.ModelAdmin):
    list_display = ["date", "interaction_type", "entity", "owner"]
    list_filter = ["interaction_type"]
