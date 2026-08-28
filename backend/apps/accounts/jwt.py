from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import UserSerializer


class UserAwareTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Returns the authenticated user alongside the token pair so the
    frontend can populate its auth context in a single login request."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class ObtainTokenPairView(TokenObtainPairView):
    serializer_class = UserAwareTokenObtainPairSerializer
