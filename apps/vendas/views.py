from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from apps.administracao.services import registrar
from .models import Venda
from .serializers import VendaSerializer


class VendaViewSet(viewsets.ModelViewSet):
    queryset = Venda.objects.all()
    serializer_class = VendaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'forma_pagamento', 'cliente']
    search_fields = ['cliente__nome']

    def perform_create(self, serializer):
        venda = serializer.save()
        registrar(
            self.request.user, 'VENDA_CRIADA',
            f'Criou a venda #{venda.pk}', alvo=venda, request=self.request,
        )

    def perform_update(self, serializer):
        status_antes = serializer.instance.status
        venda = serializer.save()
        if venda.status != status_antes:
            registrar(
                self.request.user, f'VENDA_{venda.status}',
                f'Alterou o status da venda #{venda.pk} de {status_antes} para {venda.status}',
                alvo=venda, request=self.request,
            )

    def perform_destroy(self, instance):
        numero = instance.pk
        instance.delete()
        registrar(
            self.request.user, 'VENDA_EXCLUIDA',
            f'Excluiu a venda #{numero}', request=self.request,
        )