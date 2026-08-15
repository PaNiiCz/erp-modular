from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
from .models import Estoque, MovimentacaoEstoque
from .serializers import EstoqueSerializer, MovimentacaoEstoqueSerializer


class EstoqueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Estoque.objects.all()
    serializer_class = EstoqueSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['produto__nome', 'produto__sku']
    filter_backends = [filters.SearchFilter]

    @action(detail=False, methods=['get'])
    def alertas(self, request):
        queryset = Estoque.objects.filter(quantidade_atual__lt=F('produto__estoque_minimo'))
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class MovimentacaoEstoqueViewSet(viewsets.ModelViewSet):
    queryset = MovimentacaoEstoque.objects.all()
    serializer_class = MovimentacaoEstoqueSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['produto', 'tipo']
    search_fields = ['produto__nome', 'produto__sku', 'motivo']