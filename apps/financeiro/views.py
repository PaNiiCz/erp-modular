from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum
from .models import CategoriaFinanceira, LancamentoFinanceiro
from .serializers import CategoriaFinanceiraSerializer, LancamentoFinanceiroSerializer


class CategoriaFinanceiraViewSet(viewsets.ModelViewSet):
    queryset = CategoriaFinanceira.objects.all()
    serializer_class = CategoriaFinanceiraSerializer
    permission_classes = [permissions.IsAuthenticated]


class LancamentoFinanceiroViewSet(viewsets.ModelViewSet):
    queryset = LancamentoFinanceiro.objects.all()
    serializer_class = LancamentoFinanceiroSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'status', 'forma_pagamento', 'categoria', 'cliente']
    search_fields = ['descricao', 'cliente__nome']

    @action(detail=False, methods=['get'])
    def resumo(self, request):
        receitas_pagas = LancamentoFinanceiro.objects.filter(
            tipo='RECEITA', status='PAGO'
        ).aggregate(total=Sum('valor'))['total'] or 0

        despesas_pagas = LancamentoFinanceiro.objects.filter(
            tipo='DESPESA', status='PAGO'
        ).aggregate(total=Sum('valor'))['total'] or 0

        pendentes = LancamentoFinanceiro.objects.filter(
            status='PENDENTE'
        ).aggregate(total=Sum('valor'))['total'] or 0

        return Response({
            'total_receitas': receitas_pagas,
            'total_despesas': despesas_pagas,
            'saldo': receitas_pagas - despesas_pagas,
            'total_pendente': pendentes,
        })