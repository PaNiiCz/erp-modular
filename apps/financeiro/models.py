from django.db import models
from django.utils import timezone
from apps.clientes.models import Cliente


class CategoriaFinanceira(models.Model):
    TIPO = [
        ('RECEITA', 'Receita'),
        ('DESPESA', 'Despesa'),
    ]

    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=10, choices=TIPO)

    def __str__(self):
        return f'{self.nome} ({self.get_tipo_display()})'

    class Meta:
        verbose_name = 'Categoria Financeira'
        verbose_name_plural = 'Categorias Financeiras'
        unique_together = ['nome', 'tipo']


class LancamentoFinanceiro(models.Model):
    TIPO = [
        ('RECEITA', 'Receita'),
        ('DESPESA', 'Despesa'),
    ]

    STATUS = [
        ('PENDENTE', 'Pendente'),
        ('PAGO', 'Pago'),
        ('ATRASADO', 'Atrasado'),
        ('CANCELADO', 'Cancelado'),
    ]

    FORMAS_PAGAMENTO = [
        ('DINHEIRO', 'Dinheiro'),
        ('PIX', 'Pix'),
        ('CARTAO_CREDITO', 'Cartão de Crédito'),
        ('CARTAO_DEBITO', 'Cartão de Débito'),
        ('BOLETO', 'Boleto'),
        ('TRANSFERENCIA', 'Transferência'),
    ]

    tipo = models.CharField(max_length=10, choices=TIPO)
    categoria = models.ForeignKey(CategoriaFinanceira, on_delete=models.SET_NULL, null=True, blank=True, related_name='lancamentos')
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name='lancamentos_financeiros')

    descricao = models.CharField(max_length=200)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    forma_pagamento = models.CharField(max_length=20, choices=FORMAS_PAGAMENTO, default='DINHEIRO')
    status = models.CharField(max_length=20, choices=STATUS, default='PENDENTE')

    data_vencimento = models.DateField()
    data_pagamento = models.DateField(null=True, blank=True)

    parcela_atual = models.PositiveIntegerField(default=1)
    total_parcelas = models.PositiveIntegerField(default=1)

    observacoes = models.TextField(blank=True, null=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.get_tipo_display()} - {self.descricao} - R$ {self.valor}'

    class Meta:
        ordering = ['-data_vencimento']
        verbose_name = 'Lançamento Financeiro'
        verbose_name_plural = 'Lançamentos Financeiros'


from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.vendas.models import Venda


@receiver(post_save, sender=Venda)
def gerar_receita_venda(sender, instance, created, **kwargs):
    if instance.status != 'CONFIRMADA':
        return

    if not instance.itens.exists():
        return

    ja_gerado = LancamentoFinanceiro.objects.filter(
        descricao=f'Venda #{instance.id}'
    ).exists()

    if ja_gerado:
        return

    categoria, _ = CategoriaFinanceira.objects.get_or_create(
        nome='Vendas', tipo='RECEITA'
    )

    LancamentoFinanceiro.objects.create(
        tipo='RECEITA',
        categoria=categoria,
        cliente=instance.cliente,
        descricao=f'Venda #{instance.id}',
        valor=instance.total,
        forma_pagamento=instance.forma_pagamento,
        status='PAGO',
        data_vencimento=timezone.now().date(),
        data_pagamento=timezone.now().date(),
    )


@receiver(post_save, sender=Venda)
def cancelar_receita_venda(sender, instance, created, **kwargs):
    if created or instance.status != 'CANCELADA':
        return

    LancamentoFinanceiro.objects.filter(
        descricao=f'Venda #{instance.id}'
    ).update(status='CANCELADO')

from apps.compras.models import Compra


@receiver(post_save, sender=Compra)
def gerar_despesa_compra(sender, instance, created, **kwargs):
    if instance.status != 'CONFIRMADA':
        return

    if not instance.itens.exists():
        return

    ja_gerado = LancamentoFinanceiro.objects.filter(
        descricao=f'Compra #{instance.id}'
    ).exists()

    if ja_gerado:
        return

    categoria, _ = CategoriaFinanceira.objects.get_or_create(
        nome='Compras', tipo='DESPESA'
    )

    LancamentoFinanceiro.objects.create(
        tipo='DESPESA',
        categoria=categoria,
        descricao=f'Compra #{instance.id}',
        valor=instance.total,
        forma_pagamento=instance.forma_pagamento,
        status='PAGO',
        data_vencimento=timezone.now().date(),
        data_pagamento=timezone.now().date(),
    )


@receiver(post_save, sender=Compra)
def cancelar_despesa_compra(sender, instance, created, **kwargs):
    if created or instance.status != 'CANCELADA':
        return

    LancamentoFinanceiro.objects.filter(
        descricao=f'Compra #{instance.id}'
    ).update(status='CANCELADO')