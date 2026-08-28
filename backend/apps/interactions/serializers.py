from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from apps.clubs.models import Club
from apps.contacts.models import Person

from .models import Interaction

ENTITY_MODEL_MAP = {"person": Person, "club": Club}


class InteractionSerializer(serializers.ModelSerializer):
    entity_type = serializers.ChoiceField(choices=list(ENTITY_MODEL_MAP), write_only=True)
    entity_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Interaction
        fields = ["id", "entity_type", "entity_id", "date", "interaction_type", "text", "created_at"]

    def create(self, validated_data):
        entity_type = validated_data.pop("entity_type")
        entity_id = validated_data.pop("entity_id")
        model = ENTITY_MODEL_MAP[entity_type]
        owner = self.context["request"].user
        try:
            instance = model.objects.get(pk=entity_id, owner=owner)
        except model.DoesNotExist:
            raise serializers.ValidationError({"entity_id": "El contacto/club no existe."})
        return Interaction.objects.create(
            owner=owner,
            content_type=ContentType.objects.get_for_model(model),
            object_id=instance.pk,
            **validated_data,
        )
