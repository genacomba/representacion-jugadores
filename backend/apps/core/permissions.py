from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Object-level permission: only the record's owner may access it."""

    def has_object_permission(self, request, view, obj):
        return getattr(obj, "owner_id", None) == request.user.id
