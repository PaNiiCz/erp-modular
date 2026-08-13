from django.db import models
from django.core.exceptions import ValidationError
from validate_docbr import CPF, CNPJ


def validar_cpf_cnpj(value):
    numero = ''.join(filter(str.isdigit, value))
    if len(numero) == 11:
        if not CPF().validate(numero):
            raise ValidationError('CPF inválido.')
    elif len(numero) == 14:
        if not CNPJ().validate(numero):
            raise ValidationError('CNPJ inválido.')
    else:
        raise ValidationError('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.')


class Cliente(models.Model):
    TIPO_PESSOA = [
        ('PF', 'Pessoa Física'),
        ('PJ', 'Pessoa Jurídica'),
    ]

    tipo_pessoa = models.CharField(max_length=2, choices=TIPO_PESSOA, default='PF')
    nome = models.CharField(max_length=150)
    nome_fantasia = models.CharField(max_length=150, blank=True, null=True)
    cpf_cnpj = models.CharField(max_length=18, unique=True, validators=[validar_cpf_cnpj])

    email = models.EmailField(blank=True, null=True)
    telefone_principal = models.CharField(max_length=20, blank=True, null=True)
    telefone_secundario = models.CharField(max_length=20, blank=True, null=True)

    cep = models.CharField(max_length=9, blank=True, null=True)
    logradouro = models.CharField(max_length=200, blank=True, null=True)
    numero = models.CharField(max_length=10, blank=True, null=True)
    complemento = models.CharField(max_length=100, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)

    etiquetas = models.CharField(max_length=200, blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)

    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome

    class Meta:
        ordering = ['nome']
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'