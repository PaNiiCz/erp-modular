from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models

validar_cor = RegexValidator(r'^#[0-9a-fA-F]{6}$', 'Informe uma cor no formato #RRGGBB.')


class Evento(models.Model):
    class Tipo(models.TextChoices):
        COMPROMISSO = 'COMPROMISSO', 'Compromisso'
        REUNIAO = 'REUNIAO', 'Reunião'
        EVENTO = 'EVENTO', 'Evento'
        OUTRO = 'OUTRO', 'Outro'

    class Status(models.TextChoices):
        AGENDADO = 'AGENDADO', 'Agendado'
        CONCLUIDO = 'CONCLUIDO', 'Concluído'
        CANCELADO = 'CANCELADO', 'Cancelado'

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='eventos',
    )
    participantes = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='eventos_convidado',
    )
    titulo = models.CharField(max_length=150)
    descricao = models.TextField(blank=True, default='')
    local = models.CharField(max_length=200, blank=True, default='')
    tipo = models.CharField(max_length=12, choices=Tipo.choices, default=Tipo.COMPROMISSO)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.AGENDADO)
    inicio = models.DateTimeField()
    fim = models.DateTimeField()
    dia_inteiro = models.BooleanField(default=False)
    cor = models.CharField(max_length=7, default='#4318ff', validators=[validar_cor])
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['inicio']

    def __str__(self):
        return self.titulo


class Lembrete(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name='lembretes')
    minutos_antes = models.PositiveIntegerField()
    notificado = models.BooleanField(default=False)

    class Meta:
        ordering = ['minutos_antes']
        unique_together = ('evento', 'minutos_antes')

    def __str__(self):
        return f'{self.evento} ({self.minutos_antes} min antes)'


class Notificacao(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notificacoes',
    )
    evento = models.ForeignKey(Evento, on_delete=models.SET_NULL, null=True, blank=True, related_name='notificacoes')
    titulo = models.CharField(max_length=150)
    mensagem = models.TextField(blank=True, default='')
    lida = models.BooleanField(default=False)
    criada_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criada_em']
        verbose_name = 'Notificação'
        verbose_name_plural = 'Notificações'

    def __str__(self):
        return f'{self.titulo} ({self.usuario})'