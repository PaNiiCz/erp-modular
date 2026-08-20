from django.db import models
from apps.clientes.models import Cliente
from apps.produtos.models import Produto


class Venda(models.Model):
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

    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='vendas')
    status = models.CharField(max_length=20, choices=STATUS, default='ABERTA')
    forma_pagamento = models.CharField(max_length=20, choices=FORMAS_PAGAMENTO, default='DINHEIRO')

    desconto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    observacoes = models.TextField(blank=True, null=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    @property
    def total(self):
        subtotal = sum(item.subtotal for item in self.itens.all())
        return subtotal - self.desconto

    def __str__(self):
        return f'Venda #{self.id} - {self.cliente.nome}'

    class Meta:
        ordering = ['-criado_em']
        verbose_name = 'Venda'
        verbose_name_plural = 'Vendas'


class ItemVenda(models.Model):
    venda = models.ForeignKey(Venda, on_delete=models.CASCADE, related_name='itens')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT, related_name='itens_venda')
    quantidade = models.PositiveIntegerField()
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def subtotal(self):
        return self.quantidade * self.preco_unitario

    def __str__(self):
        return f'{self.produto.nome} x{self.quantidade}'

    class Meta:
        verbose_name = 'Item da Venda'
        verbose_name_plural = 'Itens da Venda'


from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from apps.estoque.models import MovimentacaoEstoque, Estoque


@receiver(pre_save, sender=Venda)
def validar_estoque_antes_confirmar(sender, instance, **kwargs):
    if instance.status != 'CONFIRMADA':
        return

    if not instance.itens.exists():
        return
    
    if not instance.pk:
        return

    venda_anterior = Venda.objects.get(pk=instance.pk)
    if venda_anterior.status == 'CONFIRMADA':
        return

    for item in instance.itens.all():
        estoque = Estoque.objects.filter(produto=item.produto).first()
        quantidade_disponivel = estoque.quantidade_atual if estoque else 0
        if quantidade_disponivel < item.quantidade:
            raise ValidationError(
                f'Estoque insuficiente para o produto "{item.produto.nome}". '
                f'Disponível: {quantidade_disponivel}, solicitado: {item.quantidade}.'
            )


@receiver(post_save, sender=Venda)
def dar_baixa_estoque(sender, instance, created, **kwargs):
    if instance.status != 'CONFIRMADA':
        return

    ja_processada = MovimentacaoEstoque.objects.filter(
        motivo=f'Venda #{instance.id}'
    ).exists()

    if ja_processada:
        return

    for item in instance.itens.all():
        MovimentacaoEstoque.objects.create(
            produto=item.produto,
            tipo='SAIDA',
            quantidade=item.quantidade,
            motivo=f'Venda #{instance.id}'
        )


@receiver(post_save, sender=Venda)
def estornar_estoque_cancelamento(sender, instance, created, **kwargs):
    if created or instance.status != 'CANCELADA':
        return

    ja_processada_venda = MovimentacaoEstoque.objects.filter(
        motivo=f'Venda #{instance.id}'
    ).exists()
    ja_estornada = MovimentacaoEstoque.objects.filter(
        motivo=f'Estorno Venda #{instance.id}'
    ).exists()

    if not ja_processada_venda or ja_estornada:
        return

    for item in instance.itens.all():
        MovimentacaoEstoque.objects.create(
            produto=item.produto,
            tipo='ENTRADA',
            quantidade=item.quantidade,
            motivo=f'Estorno Venda #{instance.id}'
        )