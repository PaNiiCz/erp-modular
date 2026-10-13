from django.conf import settings
from django.db import models


class RegistroAtividade(models.Model):
    """Registro de auditoria: quem fez o quê, em quem/o quê e quando."""

    class Acao(models.TextChoices):
        USUARIO_ATIVADO = 'USUARIO_ATIVADO', 'Usuário ativado'
        USUARIO_DESATIVADO = 'USUARIO_DESATIVADO', 'Usuário desativado'
        ADMIN_CONCEDIDO = 'ADMIN_CONCEDIDO', 'Acesso de administração concedido'
        ADMIN_REMOVIDO = 'ADMIN_REMOVIDO', 'Acesso de administração removido'

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='atividades_registradas',
    )
    # Guardamos o nome na hora da ação, para o histórico não se perder
    # mesmo se o usuário for excluído ou renomeado depois.
    usuario_nome = models.CharField(max_length=150, blank=True)
    acao = models.CharField(max_length=40, db_index=True)
    descricao = models.CharField(max_length=255)
    alvo_tipo = models.CharField(max_length=60, blank=True)
    alvo_id = models.CharField(max_length=40, blank=True)
    alvo_nome = models.CharField(max_length=150, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-criado_em', '-id']
        verbose_name = 'Registro de atividade'
        verbose_name_plural = 'Registros de atividade'

    def __str__(self):
        return f'{self.criado_em:%d/%m/%Y %H:%M} - {self.usuario_nome} - {self.acao}'