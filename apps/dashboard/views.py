from datetime import date, timedelta

from django.db.models import Sum, F, Count
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.vendas.models import Venda, ItemVenda
from apps.compras.models import Compra
from apps.estoque.models import MovimentacaoEstoque
from apps.financeiro.models import LancamentoFinanceiro
from apps.clientes.models import Cliente

from .serializers import (
    ResumoDashboardSerializer,
    ProdutoMaisVendidoSerializer,
    VendaPorDiaSerializer,
    AtividadeRecenteSerializer,
)


class ResumoDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoje = date.today()
        inicio_mes = hoje.replace(day=1)

        # Vendas do mês (confirmadas) — total é property, soma em Python
        vendas_mes = Venda.objects.filter(
            status='CONFIRMADA',
            criado_em__gte=inicio_mes
        )
        faturamento_mes = sum(v.total for v in vendas_mes)
        total_vendas_mes = vendas_mes.count()

        # Financeiro — contas a receber/pagar pendentes
        contas_a_receber = LancamentoFinanceiro.objects.filter(
            tipo='RECEITA', status='PENDENTE'
        ).aggregate(total=Sum('valor'))['total'] or 0

        contas_a_pagar = LancamentoFinanceiro.objects.filter(
            tipo='DESPESA', status='PENDENTE'
        ).aggregate(total=Sum('valor'))['total'] or 0

        # Despesas pagas no mês (para calcular lucro)
        despesas_mes = LancamentoFinanceiro.objects.filter(
            tipo='DESPESA', status='PAGO', data_pagamento__gte=inicio_mes
        ).aggregate(total=Sum('valor'))['total'] or 0

        lucro_mes = faturamento_mes - despesas_mes

        # Clientes ativos (com pelo menos 1 venda confirmada)
        clientes_ativos = Cliente.objects.filter(
            vendas__status='CONFIRMADA'
        ).distinct().count()

        dados = {
            'faturamento_mes': faturamento_mes,
            'lucro_mes': lucro_mes,
            'total_vendas_mes': total_vendas_mes,
            'contas_a_pagar': contas_a_pagar,
            'contas_a_receber': contas_a_receber,
            'clientes_ativos': clientes_ativos,
        }

        serializer = ResumoDashboardSerializer(dados)
        return Response(serializer.data)


class ProdutosMaisVendidosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limite = int(request.query_params.get('limite', 5))

        ranking = (
            ItemVenda.objects
            .filter(venda__status='CONFIRMADA')
            .values('produto__id', 'produto__nome', 'produto__sku')
            .annotate(
                quantidade_vendida=Sum('quantidade'),
                valor_total_vendido=Sum(F('quantidade') * F('preco_unitario'))
            )
            .order_by('-quantidade_vendida')[:limite]
        )

        dados = [
            {
                'produto_id': item['produto__id'],
                'nome': item['produto__nome'],
                'sku': item['produto__sku'],
                'quantidade_vendida': item['quantidade_vendida'],
                'valor_total_vendido': item['valor_total_vendido'],
            }
            for item in ranking
        ]

        serializer = ProdutoMaisVendidoSerializer(dados, many=True)
        return Response(serializer.data)


class GraficoVendasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        dias = int(request.query_params.get('dias', 30))
        data_inicio = date.today() - timedelta(days=dias - 1)

        faturamento_por_dia = (
            ItemVenda.objects
            .filter(venda__status='CONFIRMADA', venda__criado_em__date__gte=data_inicio)
            .annotate(dia=TruncDate('venda__criado_em'))
            .values('dia')
            .annotate(faturamento=Sum(F('quantidade') * F('preco_unitario')))
        )
        faturamento_map = {item['dia']: item['faturamento'] for item in faturamento_por_dia}

        vendas_por_dia = (
            Venda.objects
            .filter(status='CONFIRMADA', criado_em__date__gte=data_inicio)
            .annotate(dia=TruncDate('criado_em'))
            .values('dia')
            .annotate(quantidade=Count('id'))
        )
        vendas_map = {item['dia']: item['quantidade'] for item in vendas_por_dia}

        dados = []
        for i in range(dias):
            dia = data_inicio + timedelta(days=i)
            dados.append({
                'dia': dia,
                'faturamento': faturamento_map.get(dia, 0),
                'quantidade_vendas': vendas_map.get(dia, 0),
            })

        serializer = VendaPorDiaSerializer(dados, many=True)
        return Response(serializer.data)

class AtividadesRecentesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limite = int(request.query_params.get('limite', 10))
        atividades = []

        for venda in Venda.objects.select_related('cliente').order_by('-criado_em')[:limite]:
            nome_cliente = venda.cliente.nome if venda.cliente else 'Cliente não informado'
            atividades.append({
                'tipo': 'venda',
                'descricao': f'Venda #{venda.id} — {nome_cliente} ({venda.get_status_display()})',
                'data': venda.criado_em,
            })

        for compra in Compra.objects.select_related('fornecedor').order_by('-criado_em')[:limite]:
            nome_fornecedor = compra.fornecedor.nome if compra.fornecedor else 'Fornecedor não informado'
            atividades.append({
                'tipo': 'compra',
                'descricao': f'Compra #{compra.id} — {nome_fornecedor} ({compra.get_status_display()})',
                'data': compra.criado_em,
            })

        for mov in MovimentacaoEstoque.objects.select_related('produto').order_by('-criado_em')[:limite]:
            atividades.append({
                'tipo': 'estoque',
                'descricao': f'{mov.get_tipo_display()} de {mov.quantidade}x {mov.produto.nome}',
                'data': mov.criado_em,
            })

        atividades.sort(key=lambda a: a['data'], reverse=True)
        atividades = atividades[:limite]

        serializer = AtividadeRecenteSerializer(atividades, many=True)
        return Response(serializer.data)