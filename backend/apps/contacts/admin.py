from django.contrib import admin

from .models import Person, Relationship, RelationshipType


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ["full_name", "category", "current_club", "owner", "is_favorite"]
    list_filter = ["category", "is_favorite", "nationality"]
    search_fields = ["first_name", "last_name", "nickname"]


@admin.register(RelationshipType)
class RelationshipTypeAdmin(admin.ModelAdmin):
    list_display = ["label", "code", "inverse_label"]


@admin.register(Relationship)
class RelationshipAdmin(admin.ModelAdmin):
    list_display = ["from_entity", "relationship_type", "to_entity", "owner"]
