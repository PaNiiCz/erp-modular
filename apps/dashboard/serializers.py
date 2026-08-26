from rest_framework import serializers


class ResumoDashboardSerializer(serializers.Serializer):
    faturamento_mes = serializers.DecimalField(max_digits=12, decimal_places=2)
    lucro_mes = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_vendas_mes = serializers.IntegerField()
    contas_a_pagar = serializers.DecimalField(max_digits=12, decimal_places=2)
    contas_a_receber = serializers.DecimalField(max_digits=12, decimal_places=2)
    clientes_ativos = serializers.IntegerField()

class ProdutoMaisVendidoSerializer(serializers.Serializer):
    produto_id = serializers.IntegerField()
    nome = serializers.CharField()
    sku = serializers.CharField()
    quantidade_vendida = serializers.IntegerField()
    valor_total_vendido = serializers.DecimalField(max_digits=12, decimal_places=2)

class VendaPorDiaSerializer(serializers.Serializer):
    dia = serializers.DateField()
    faturamento = serializers.DecimalField(max_digits=12, decimal_places=2)
    quantidade_vendas = serializers.IntegerField()

class AtividadeRecenteSerializer(serializers.Serializer):
    tipo = serializers.CharField()
    descricao = serializers.CharField()
    data = serializers.DateTimeField()