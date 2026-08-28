from django.contrib import admin

from .models import PlayerProfile, PlayerStatus, Position


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "order"]


@admin.register(PlayerStatus)
class PlayerStatusAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "order"]


@admin.register(PlayerProfile)
class PlayerProfileAdmin(admin.ModelAdmin):
    list_display = ["person", "primary_position", "status", "represented_by"]
    list_filter = ["primary_position", "status"]
