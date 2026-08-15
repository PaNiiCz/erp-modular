from rest_framework import serializers
from .models import Estoque, MovimentacaoEstoque


class EstoqueSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    produto_sku = serializers.CharField(source='produto.sku', read_only=True)
    abaixo_do_minimo = serializers.BooleanField(read_only=True)

    class Meta:
        model = Estoque
        fields = ['id', 'produto', 'produto_nome', 'produto_sku', 'quantidade_atual', 'abaixo_do_minimo', 'atualizado_em']


class MovimentacaoEstoqueSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)

    class Meta:
        model = MovimentacaoEstoque
        fields = ['id', 'produto', 'produto_nome', 'tipo', 'quantidade', 'motivo', 'observacoes', 'criado_em']