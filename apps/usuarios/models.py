from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True)
    email_confirmado = models.BooleanField(default=False)
    data_nascimento = models.DateField(blank=True, null=True)

    def __str__(self):
        return self.username