from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from apps.administracao.services import registrar
from .models import Compra
from .serializers import CompraSerializer


class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compra.objects.all()
    serializer_class = CompraSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'forma_pagamento', 'fornecedor']
    search_fields = ['fornecedor__nome']

    def perform_create(self, serializer):
        compra = serializer.save()
        registrar(
            self.request.user, 'COMPRA_CRIADA',
            f'Criou a compra #{compra.pk}', alvo=compra, request=self.request,
        )

    def perform_update(self, serializer):
        status_antes = serializer.instance.status
        compra = serializer.save()
        if compra.status != status_antes:
            registrar(
                self.request.user, f'COMPRA_{compra.status}',
                f'Alterou o status da compra #{compra.pk} de {status_antes} para {compra.status}',
                alvo=compra, request=self.request,
            )

    def perform_destroy(self, instance):
        numero = instance.pk
        instance.delete()
        registrar(
            self.request.user, 'COMPRA_EXCLUIDA',
            f'Excluiu a compra #{numero}', request=self.request,
        )