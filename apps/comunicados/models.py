from django.conf import settings
from django.db import models


class Comunicado(models.Model):
    class Categoria(models.TextChoices):
        ENTRADA = "ENTRADA", "Entrada"
        SAIDA = "SAIDA", "Saída"
        ENTREGA = "ENTREGA", "Entrega"
        GERAL = "GERAL", "Geral"

    titulo = models.CharField(max_length=200)
    texto = models.TextField()
    categoria = models.CharField(
        max_length=10, choices=Categoria.choices, default=Categoria.GERAL
    )
    fixado = models.BooleanField(default=False)
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="comunicados_publicados",
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-fixado", "-criado_em"]

    def __str__(self):
        return self.titulo


class Leitura(models.Model):
    comunicado = models.ForeignKey(
        Comunicado, on_delete=models.CASCADE, related_name="leituras"
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comunicados_lidos",
    )
    lida_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("comunicado", "usuario")

    def __str__(self):
        return f"{self.usuario} leu {self.comunicado}"