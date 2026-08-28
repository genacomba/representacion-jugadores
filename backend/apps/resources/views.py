from django.contrib.contenttypes.models import ContentType
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser

from .models import Resource
from .serializers import ENTITY_MODEL_MAP, ResourceSerializer


class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = Resource.objects.filter(owner=self.request.user)
        entity_type = self.request.query_params.get("entity_type")
        entity_id = self.request.query_params.get("entity_id")
        if entity_type and entity_id:
            model = ENTITY_MODEL_MAP.get(entity_type)
            if not model:
                raise ValidationError({"entity_type": "Tipo de entidad inválido."})
            qs = qs.filter(
                content_type=ContentType.objects.get_for_model(model), object_id=entity_id
            )
        return qs
