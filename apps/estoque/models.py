from django.db import models
from apps.produtos.models import Produto


class MovimentacaoEstoque(models.Model):
    TIPO_MOVIMENTACAO = [
        ('ENTRADA', 'Entrada'),
        ('SAIDA', 'Saída'),
        ('AJUSTE', 'Ajuste'),
        ('TRANSFERENCIA', 'Transferência'),
    ]

    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='movimentacoes')
    tipo = models.CharField(max_length=20, choices=TIPO_MOVIMENTACAO)
    quantidade = models.PositiveIntegerField()
    motivo = models.CharField(max_length=200, blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)

    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.tipo} - {self.produto.nome} ({self.quantidade})'

    class Meta:
        ordering = ['-criado_em']
        verbose_name = 'Movimentação de Estoque'
        verbose_name_plural = 'Movimentações de Estoque'


class Estoque(models.Model):
    produto = models.OneToOneField(Produto, on_delete=models.CASCADE, related_name='estoque')
    quantidade_atual = models.PositiveIntegerField(default=0)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.produto.nome}: {self.quantidade_atual} unidades'

    @property
    def abaixo_do_minimo(self):
        return self.quantidade_atual < self.produto.estoque_minimo

    class Meta:
        verbose_name = 'Estoque'
        verbose_name_plural = 'Estoques'


from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=MovimentacaoEstoque)
def atualizar_estoque(sender, instance, created, **kwargs):
    if not created:
        return

    estoque, _ = Estoque.objects.get_or_create(produto=instance.produto)

    if instance.tipo == 'ENTRADA':
        estoque.quantidade_atual += instance.quantidade
    elif instance.tipo == 'SAIDA':
        estoque.quantidade_atual = max(0, estoque.quantidade_atual - instance.quantidade)
    elif instance.tipo == 'AJUSTE':
        estoque.quantidade_atual = instance.quantidade
    elif instance.tipo == 'TRANSFERENCIA':
        estoque.quantidade_atual = max(0, estoque.quantidade_atual - instance.quantidade)

    estoque.save()