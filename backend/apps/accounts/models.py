from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model so the app can evolve past a single administrator
    without a disruptive migration later (e.g. adding roles, agencies).
    """

    display_name = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return self.display_name or self.get_username()
