from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class AuthTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="rep", password="Sup3rSecret!")

    def test_login_with_valid_credentials_returns_tokens_and_user(self):
        response = self.client.post(
            reverse("token_obtain_pair"), {"username": "rep", "password": "Sup3rSecret!"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["username"], "rep")

    def test_login_with_invalid_credentials_is_rejected(self):
        response = self.client.post(
            reverse("token_obtain_pair"), {"username": "rep", "password": "wrong"}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_authentication(self):
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user_when_authenticated(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "rep")

    def test_logout_blacklists_refresh_token(self):
        login = self.client.post(
            reverse("token_obtain_pair"), {"username": "rep", "password": "Sup3rSecret!"}
        )
        refresh = login.data["refresh"]
        self.client.force_authenticate(self.user)

        logout_response = self.client.post(reverse("logout"), {"refresh": refresh})
        self.assertEqual(logout_response.status_code, status.HTTP_205_RESET_CONTENT)

        refresh_response = self.client.post(reverse("token_refresh"), {"refresh": refresh})
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)
