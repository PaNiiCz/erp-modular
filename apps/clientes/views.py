from rest_framework import viewsets, permissions, filters
from .models import Cliente
from .serializers import ClienteSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nome', 'nome_fantasia', 'cpf_cnpj', 'email', 'cidade']