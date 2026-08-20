from django.db import models
from apps.produtos.models import Produto, Fornecedor


class Compra(models.Model):
    STATUS = [
        ('ABERTA', 'Aberta'),
        ('CONFIRMADA', 'Confirmada'),
        ('CANCELADA', 'Cancelada'),
    ]

    FORMAS_PAGAMENTO = [
        ('DINHEIRO', 'Dinheiro'),
        ('PIX', 'Pix'),
        ('CARTAO_CREDITO', 'Cartão de Crédito'),
        ('CARTAO_DEBITO', 'Cartão de Débito'),
        ('BOLETO', 'Boleto'),
    ]

    fornecedor = models.ForeignKey(Fornecedor, on_delete=models.PROTECT, related_name='compras')
    status = models.CharField(max_length=20, choices=STATUS, default='ABERTA')
    forma_pagamento = models.CharField(max_length=20, choices=FORMAS_PAGAMENTO, default='BOLETO')

    desconto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    observacoes = models.TextField(blank=True, null=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    @property
    def total(self):
        subtotal = sum(item.subtotal for item in self.itens.all())
        return subtotal - self.desconto

    def __str__(self):
        return f'Compra #{self.id} - {self.fornecedor.nome}'

    class Meta:
        ordering = ['-criado_em']
        verbose_name = 'Compra'
        verbose_name_plural = 'Compras'


class ItemCompra(models.Model):
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name='itens')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT, related_name='itens_compra')
    quantidade = models.PositiveIntegerField()
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def subtotal(self):
        return self.quantidade * self.preco_unitario

    def __str__(self):
        return f'{self.produto.nome} x{self.quantidade}'

    class Meta:
        verbose_name = 'Item da Compra'
        verbose_name_plural = 'Itens da Compra'

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from apps.estoque.models import MovimentacaoEstoque


@receiver(post_save, sender=Compra)
def dar_entrada_estoque(sender, instance, created, **kwargs):
    if instance.status != 'CONFIRMADA':
        return

    if not instance.itens.exists():
        return

    ja_processada = MovimentacaoEstoque.objects.filter(
        motivo=f'Compra #{instance.id}'
    ).exists()

    if ja_processada:
        return

    for item in instance.itens.all():
        MovimentacaoEstoque.objects.create(
            produto=item.produto,
            tipo='ENTRADA',
            quantidade=item.quantidade,
            motivo=f'Compra #{instance.id}'
        )


@receiver(post_save, sender=Compra)
def estornar_entrada_cancelamento(sender, instance, created, **kwargs):
    if created or instance.status != 'CANCELADA':
        return

    ja_processada = MovimentacaoEstoque.objects.filter(
        motivo=f'Compra #{instance.id}'
    ).exists()
    ja_estornada = MovimentacaoEstoque.objects.filter(
        motivo=f'Estorno Compra #{instance.id}'
    ).exists()

    if not ja_processada or ja_estornada:
        return

    for item in instance.itens.all():
        MovimentacaoEstoque.objects.create(
            produto=item.produto,
            tipo='SAIDA',
            quantidade=item.quantidade,
            motivo=f'Estorno Compra #{instance.id}'
        )