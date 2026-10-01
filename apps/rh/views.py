import os

from django.db.models import Count, ProtectedError, Sum
from django.http import FileResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cargo, Departamento, DocumentoFuncionario, Escala, Ferias, Funcionario
from .permissions import AcessoRH
from .serializers import (
    CargoSerializer,
    DepartamentoSerializer,
    DocumentoFuncionarioSerializer,
    EscalaSerializer,
    FeriasSerializer,
    FuncionarioSerializer,
)


class AcessoRHView(APIView):
    """Usado pelo front-end para saber se o usuário pode ver o módulo de RH."""

    permission_classes = [AcessoRH]

    def get(self, request):
        return Response({'acesso': True})


class BaseRHViewSet(viewsets.ModelViewSet):
    """Base dos ViewSets do RH: permissão de RH, filtros e exclusão protegida."""

    permission_classes = [AcessoRH]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    mensagem_protegido = 'Não é possível excluir: existem registros vinculados a este item.'

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response({'detail': self.mensagem_protegido}, status=status.HTTP_400_BAD_REQUEST)


class DepartamentoViewSet(BaseRHViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    filterset_fields = ['ativo']
    search_fields = ['nome', 'descricao']
    mensagem_protegido = 'Não é possível excluir: existem cargos ou funcionários neste departamento.'


class CargoViewSet(BaseRHViewSet):
    queryset = Cargo.objects.select_related('departamento')
    serializer_class = CargoSerializer
    filterset_fields = ['departamento', 'ativo']
    search_fields = ['nome', 'descricao', 'departamento__nome']
    mensagem_protegido = 'Não é possível excluir: existem funcionários com este cargo.'


class FuncionarioViewSet(BaseRHViewSet):
    queryset = Funcionario.objects.select_related('cargo', 'departamento')
    serializer_class = FuncionarioSerializer
    filterset_fields = ['status', 'departamento', 'cargo']
    search_fields = ['nome', 'cpf', 'email', 'cargo__nome', 'departamento__nome']

    @action(detail=False, methods=['get'])
    def resumo(self, request):
        todos = Funcionario.objects.all()
        ativos = todos.exclude(status=Funcionario.Status.DESLIGADO)

        por_status = {
            item['status']: item['total']
            for item in todos.values('status').annotate(total=Count('id'))
        }
        por_departamento = list(
            ativos.values('departamento__nome')
            .annotate(total=Count('id'))
            .order_by('departamento__nome')
        )
        folha = ativos.aggregate(total=Sum('salario'))['total'] or 0

        return Response({
            'total_funcionarios': todos.count(),
            'total_ativos': ativos.count(),
            'por_status': por_status,
            'por_departamento': por_departamento,
            'folha_salarial': folha,
        })


class FeriasViewSet(BaseRHViewSet):
    queryset = Ferias.objects.select_related('funcionario')
    serializer_class = FeriasSerializer
    filterset_fields = ['status', 'funcionario']
    search_fields = ['funcionario__nome', 'observacoes']

    def _mudar_status(self, novo_status, permitidos):
        ferias = self.get_object()
        if ferias.status not in permitidos:
            return Response(
                {'detail': f'Não é possível alterar uma solicitação com status "{ferias.get_status_display()}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ferias.status = novo_status
        ferias.save(update_fields=['status'])
        return Response(self.get_serializer(ferias).data)

    @action(detail=True, methods=['post'])
    def aprovar(self, request, pk=None):
        return self._mudar_status(Ferias.Status.APROVADA, [Ferias.Status.SOLICITADA])

    @action(detail=True, methods=['post'])
    def rejeitar(self, request, pk=None):
        return self._mudar_status(Ferias.Status.REJEITADA, [Ferias.Status.SOLICITADA])

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        return self._mudar_status(
            Ferias.Status.CANCELADA,
            [Ferias.Status.SOLICITADA, Ferias.Status.APROVADA],
        )


class EscalaViewSet(BaseRHViewSet):
    queryset = Escala.objects.select_related('funcionario')
    serializer_class = EscalaSerializer
    filterset_fields = ['funcionario', 'dia_semana']
    search_fields = ['funcionario__nome']


class DocumentoFuncionarioViewSet(BaseRHViewSet):
    queryset = DocumentoFuncionario.objects.select_related('funcionario')
    serializer_class = DocumentoFuncionarioSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ['funcionario', 'tipo']
    search_fields = ['titulo', 'funcionario__nome']

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        documento = self.get_object()  # já passa pela permissão de RH
        try:
            arquivo = documento.arquivo.open('rb')
        except FileNotFoundError:
            return Response({'detail': 'Arquivo não encontrado no servidor.'}, status=status.HTTP_404_NOT_FOUND)

        resposta = FileResponse(arquivo, filename=os.path.basename(documento.arquivo.name))
        resposta['X-Content-Type-Options'] = 'nosniff'
        resposta['Cache-Control'] = 'private, no-store'
        return resposta