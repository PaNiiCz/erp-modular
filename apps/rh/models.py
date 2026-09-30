from django.conf import settings
from django.db import models

from .validators import validar_cpf


class Departamento(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(blank=True, default='')
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nome']

    def __str__(self):
        return self.nome


class Cargo(models.Model):
    nome = models.CharField(max_length=100)
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.PROTECT,
        related_name='cargos',
        null=True,
        blank=True,
    )
    descricao = models.TextField(blank=True, default='')
    salario_base = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nome']
        unique_together = ('nome', 'departamento')

    def __str__(self):
        return self.nome


class Funcionario(models.Model):
    class Status(models.TextChoices):
        ATIVO = 'ATIVO', 'Ativo'
        FERIAS = 'FERIAS', 'Em férias'
        AFASTADO = 'AFASTADO', 'Afastado'
        DESLIGADO = 'DESLIGADO', 'Desligado'

    nome = models.CharField(max_length=150)
    cpf = models.CharField(max_length=11, unique=True, validators=[validar_cpf])
    email = models.EmailField(unique=True)
    telefone = models.CharField(max_length=20, blank=True, default='')
    data_nascimento = models.DateField(null=True, blank=True)
    data_admissao = models.DateField()
    data_demissao = models.DateField(null=True, blank=True)
    cargo = models.ForeignKey(Cargo, on_delete=models.PROTECT, related_name='funcionarios')
    departamento = models.ForeignKey(Departamento, on_delete=models.PROTECT, related_name='funcionarios')
    salario = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ATIVO)
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='funcionario',
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nome']

    def __str__(self):
        return self.nome


class Ferias(models.Model):
    class Status(models.TextChoices):
        SOLICITADA = 'SOLICITADA', 'Solicitada'
        APROVADA = 'APROVADA', 'Aprovada'
        REJEITADA = 'REJEITADA', 'Rejeitada'
        CANCELADA = 'CANCELADA', 'Cancelada'

    funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE, related_name='ferias')
    data_inicio = models.DateField()
    data_fim = models.DateField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.SOLICITADA)
    observacoes = models.TextField(blank=True, default='')
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-data_inicio']
        verbose_name = 'Férias'
        verbose_name_plural = 'Férias'

    @property
    def dias(self):
        return (self.data_fim - self.data_inicio).days + 1

    def __str__(self):
        return f'{self.funcionario} ({self.data_inicio} a {self.data_fim})'


class Escala(models.Model):
    class DiaSemana(models.IntegerChoices):
        SEGUNDA = 0, 'Segunda-feira'
        TERCA = 1, 'Terça-feira'
        QUARTA = 2, 'Quarta-feira'
        QUINTA = 3, 'Quinta-feira'
        SEXTA = 4, 'Sexta-feira'
        SABADO = 5, 'Sábado'
        DOMINGO = 6, 'Domingo'

    funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE, related_name='escalas')
    dia_semana = models.IntegerField(choices=DiaSemana.choices)
    hora_inicio = models.TimeField()
    hora_fim = models.TimeField()

    class Meta:
        ordering = ['funcionario__nome', 'dia_semana']
        unique_together = ('funcionario', 'dia_semana')

    def __str__(self):
        return f'{self.funcionario} - {self.get_dia_semana_display()}'


class DocumentoFuncionario(models.Model):
    class Tipo(models.TextChoices):
        RG = 'RG', 'RG'
        CPF = 'CPF', 'CPF'
        CTPS = 'CTPS', 'Carteira de trabalho'
        CONTRATO = 'CONTRATO', 'Contrato'
        ASO = 'ASO', 'Atestado de saúde ocupacional'
        COMPROVANTE = 'COMPROVANTE', 'Comprovante de residência'
        OUTRO = 'OUTRO', 'Outro'

    funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE, related_name='documentos')
    tipo = models.CharField(max_length=12, choices=Tipo.choices, default=Tipo.OUTRO)
    titulo = models.CharField(max_length=150)
    arquivo = models.FileField(upload_to='rh/documentos/')
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']
        verbose_name = 'Documento do funcionário'
        verbose_name_plural = 'Documentos dos funcionários'

    def __str__(self):
        return f'{self.titulo} ({self.funcionario})'