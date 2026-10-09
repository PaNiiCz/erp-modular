from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone

validar_cor = RegexValidator(r'^#[0-9a-fA-F]{6}$', 'Informe uma cor no formato #RRGGBB.')


class Projeto(models.Model):
    nome = models.CharField(max_length=120)
    descricao = models.TextField(blank=True, default='')
    cor = models.CharField(max_length=7, default='#4318ff', validators=[validar_cor])
    arquivado = models.BooleanField(default=False)
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='projetos_criados',
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nome']

    def __str__(self):
        return self.nome


class Tarefa(models.Model):
    class Tipo(models.TextChoices):
        TAREFA = 'TAREFA', 'Tarefa'
        SOLICITACAO = 'SOLICITACAO', 'Solicitação'

    class Status(models.TextChoices):
        A_FAZER = 'A_FAZER', 'A fazer'
        EM_ANDAMENTO = 'EM_ANDAMENTO', 'Em andamento'
        EM_REVISAO = 'EM_REVISAO', 'Em revisão'
        CONCLUIDA = 'CONCLUIDA', 'Concluída'

    class Prioridade(models.TextChoices):
        BAIXA = 'BAIXA', 'Baixa'
        MEDIA = 'MEDIA', 'Média'
        ALTA = 'ALTA', 'Alta'
        URGENTE = 'URGENTE', 'Urgente'

    projeto = models.ForeignKey(
        Projeto, on_delete=models.SET_NULL, null=True, blank=True, related_name='tarefas'
    )
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True, default='')
    tipo = models.CharField(max_length=15, choices=Tipo.choices, default=Tipo.TAREFA)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.A_FAZER)
    prioridade = models.CharField(max_length=10, choices=Prioridade.choices, default=Prioridade.MEDIA)
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tarefas_criadas',
    )
    responsavel = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tarefas_responsavel',
    )
    # Setor que deve atender o pedido (Almoxarifado, Manutenção, Compras...)
    setor_destino = models.ForeignKey(
        'rh.Departamento',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tarefas_recebidas',
    )
    prazo = models.DateField(null=True, blank=True)
    concluida_em = models.DateTimeField(null=True, blank=True)
    ordem = models.PositiveIntegerField(default=0)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ordem', '-criado_em']
        indexes = [models.Index(fields=['status'])]

    def __str__(self):
        return self.titulo

    def save(self, *args, **kwargs):
        # Guarda quando foi concluída e limpa se a tarefa voltar para o quadro
        if self.status == self.Status.CONCLUIDA:
            if not self.concluida_em:
                self.concluida_em = timezone.now()
        else:
            self.concluida_em = None
        super().save(*args, **kwargs)


class ItemChecklist(models.Model):
    tarefa = models.ForeignKey(Tarefa, on_delete=models.CASCADE, related_name='checklist')
    texto = models.CharField(max_length=200)
    concluido = models.BooleanField(default=False)
    ordem = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['ordem', 'id']

    def __str__(self):
        return self.texto


class Comentario(models.Model):
    tarefa = models.ForeignKey(Tarefa, on_delete=models.CASCADE, related_name='comentarios')
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='comentarios_tarefas',
    )
    texto = models.TextField()
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['criado_em']

    def __str__(self):
        return f'Comentário em {self.tarefa}'