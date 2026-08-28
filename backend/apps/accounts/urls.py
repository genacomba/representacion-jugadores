from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.jwt import ObtainTokenPairView
from .views import LogoutView, MeView

urlpatterns = [
    path("token/", ObtainTokenPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
]
