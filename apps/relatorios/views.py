from datetime import datetime

from django.db.models import Sum, F
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.vendas.models import Venda, ItemVenda
from apps.financeiro.models import LancamentoFinanceiro

from .utils import exportar_relatorio


def _parse_data(valor):
    if not valor:
        return None
    try:
        return datetime.strptime(valor, '%Y-%m-%d').date()
    except ValueError:
        return None


class RelatorioVendasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        formato = request.query_params.get('formato', 'csv')
        data_inicio = _parse_data(request.query_params.get('data_inicio'))
        data_fim = _parse_data(request.query_params.get('data_fim'))
        status_filtro = request.query_params.get('status')
        cliente_id = request.query_params.get('cliente')

        vendas = Venda.objects.select_related('cliente').prefetch_related('itens').order_by('-criado_em')

        if data_inicio:
            vendas = vendas.filter(criado_em__date__gte=data_inicio)
        if data_fim:
            vendas = vendas.filter(criado_em__date__lte=data_fim)
        if status_filtro:
            vendas = vendas.filter(status=status_filtro)
        if cliente_id:
            vendas = vendas.filter(cliente_id=cliente_id)

        colunas = ['ID', 'Cliente', 'Status', 'Forma de pagamento', 'Total (R$)', 'Data']
        linhas = [
            [
                venda.id,
                venda.cliente.nome if venda.cliente else '—',
                venda.get_status_display(),
                venda.get_forma_pagamento_display(),
                f'{venda.total:.2f}',
                venda.criado_em.strftime('%d/%m/%Y %H:%M'),
            ]
            for venda in vendas
        ]

        return exportar_relatorio('Relatório de Vendas', colunas, linhas, formato, 'relatorio_vendas')


class RelatorioFinanceiroView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        formato = request.query_params.get('formato', 'csv')
        data_inicio = _parse_data(request.query_params.get('data_inicio'))
        data_fim = _parse_data(request.query_params.get('data_fim'))
        tipo_filtro = request.query_params.get('tipo')
        status_filtro = request.query_params.get('status')

        lancamentos = LancamentoFinanceiro.objects.select_related('categoria', 'cliente').order_by('-data_vencimento')

        if data_inicio:
            lancamentos = lancamentos.filter(data_vencimento__gte=data_inicio)
        if data_fim:
            lancamentos = lancamentos.filter(data_vencimento__lte=data_fim)
        if tipo_filtro:
            lancamentos = lancamentos.filter(tipo=tipo_filtro)
        if status_filtro:
            lancamentos = lancamentos.filter(status=status_filtro)

        colunas = ['Descrição', 'Tipo', 'Categoria', 'Valor (R$)', 'Vencimento', 'Pagamento', 'Status']
        linhas = [
            [
                lanc.descricao,
                lanc.get_tipo_display(),
                lanc.categoria.nome if lanc.categoria else '—',
                f'{lanc.valor:.2f}',
                lanc.data_vencimento.strftime('%d/%m/%Y'),
                lanc.data_pagamento.strftime('%d/%m/%Y') if lanc.data_pagamento else '—',
                lanc.get_status_display(),
            ]
            for lanc in lancamentos
        ]

        return exportar_relatorio('Relatório Financeiro', colunas, linhas, formato, 'relatorio_financeiro')


class RelatorioProdutosMaisVendidosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        formato = request.query_params.get('formato', 'csv')
        data_inicio = _parse_data(request.query_params.get('data_inicio'))
        data_fim = _parse_data(request.query_params.get('data_fim'))

        itens = ItemVenda.objects.filter(venda__status='CONFIRMADA')

        if data_inicio:
            itens = itens.filter(venda__criado_em__date__gte=data_inicio)
        if data_fim:
            itens = itens.filter(venda__criado_em__date__lte=data_fim)

        ranking = (
            itens
            .values('produto__sku', 'produto__nome')
            .annotate(
                quantidade_vendida=Sum('quantidade'),
                valor_total_vendido=Sum(F('quantidade') * F('preco_unitario'))
            )
            .order_by('-quantidade_vendida')
        )

        colunas = ['SKU', 'Produto', 'Quantidade vendida', 'Valor total vendido (R$)']
        linhas = [
            [
                item['produto__sku'],
                item['produto__nome'],
                item['quantidade_vendida'],
                f"{item['valor_total_vendido']:.2f}",
            ]
            for item in ranking
        ]

        return exportar_relatorio('Produtos Mais Vendidos', colunas, linhas, formato, 'relatorio_produtos_mais_vendidos')