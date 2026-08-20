from rest_framework import serializers
from .models import CategoriaFinanceira, LancamentoFinanceiro


class CategoriaFinanceiraSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaFinanceira
        fields = '__all__'


class LancamentoFinanceiroSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)

    class Meta:
        model = LancamentoFinanceiro
        fields = ['id', 'tipo', 'categoria', 'categoria_nome', 'cliente', 'cliente_nome',
                  'descricao', 'valor', 'forma_pagamento', 'status', 'data_vencimento',
                  'data_pagamento', 'parcela_atual', 'total_parcelas', 'observacoes',
                  'criado_em', 'atualizado_em']