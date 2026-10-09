from django.db.models import Count, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Comentario, ItemChecklist, Projeto, Tarefa
from .permissions import (
    AlteraComentario,
    AlteraItemChecklist,
    AlteraProjeto,
    AlteraTarefa,
    pode_alterar_tarefa,
)
from .serializers import (
    ComentarioSerializer,
    ItemChecklistSerializer,
    ProjetoSerializer,
    TarefaSerializer,
)


class ProjetoViewSet(viewsets.ModelViewSet):
    serializer_class = ProjetoSerializer
    permission_classes = [IsAuthenticated, AlteraProjeto]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['arquivado']
    search_fields = ['nome', 'descricao']
    queryset = (
        Projeto.objects.select_related('criado_por')
        .annotate(
            total_tarefas=Count('tarefas', distinct=True),
            tarefas_concluidas=Count(
                'tarefas', filter=Q(tarefas__status=Tarefa.Status.CONCLUIDA), distinct=True
            ),
        )
    )

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)


class TarefaViewSet(viewsets.ModelViewSet):
    serializer_class = TarefaSerializer
    permission_classes = [IsAuthenticated, AlteraTarefa]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'prioridade', 'tipo', 'projeto', 'responsavel', 'setor_destino', 'criado_por']
    search_fields = ['titulo', 'descricao']
    ordering_fields = ['ordem', 'prazo', 'prioridade', 'criado_em']
    queryset = (
        Tarefa.objects.select_related('projeto', 'criado_por', 'responsavel', 'setor_destino')
        .prefetch_related('checklist')
        .annotate(total_comentarios=Count('comentarios'))
    )

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def mover(self, request, pk=None):
        """Move a tarefa de coluna no quadro (e, se quiser, de posição)."""
        tarefa = self.get_object()
        novo_status = request.data.get('status')
        if novo_status not in Tarefa.Status.values:
            return Response({'status': ['Status inválido.']}, status=status.HTTP_400_BAD_REQUEST)
        ordem = request.data.get('ordem')
        if ordem is not None:
            try:
                tarefa.ordem = max(int(ordem), 0)
            except (TypeError, ValueError):
                return Response({'ordem': ['Informe um número inteiro.']}, status=status.HTTP_400_BAD_REQUEST)
        tarefa.status = novo_status
        tarefa.save()
        return Response(self.get_serializer(tarefa).data)

    @action(detail=False, methods=['get'])
    def minhas(self, request):
        """Tarefas em que o usuário é responsável ou que ele mesmo criou."""
        consulta = self.filter_queryset(self.get_queryset()).filter(
            Q(responsavel=request.user) | Q(criado_por=request.user)
        )
        pagina = self.paginate_queryset(consulta)
        if pagina is not None:
            return self.get_paginated_response(self.get_serializer(pagina, many=True).data)
        return Response(self.get_serializer(consulta, many=True).data)

    @action(detail=False, methods=['get'])
    def resumo(self, request):
        """Números para os cartões do topo do quadro."""
        base = Tarefa.objects.all()
        abertas = base.exclude(status=Tarefa.Status.CONCLUIDA)
        return Response(
            {
                'por_status': {valor: base.filter(status=valor).count() for valor in Tarefa.Status.values},
                'atrasadas': abertas.filter(prazo__lt=timezone.localdate()).count(),
                'minhas_abertas': abertas.filter(responsavel=request.user).count(),
            }
        )


class ItemChecklistViewSet(viewsets.ModelViewSet):
    serializer_class = ItemChecklistSerializer
    permission_classes = [IsAuthenticated, AlteraItemChecklist]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tarefa']
    pagination_class = None
    queryset = ItemChecklist.objects.select_related('tarefa')

    def _conferir(self, serializer):
        tarefa = serializer.validated_data.get('tarefa')
        if tarefa and not pode_alterar_tarefa(self.request.user, tarefa):
            raise PermissionDenied('Só quem criou a tarefa ou é o responsável pode mexer no checklist.')

    def perform_create(self, serializer):
        self._conferir(serializer)
        serializer.save()

    def perform_update(self, serializer):
        self._conferir(serializer)
        serializer.save()


class ComentarioViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ComentarioSerializer
    permission_classes = [IsAuthenticated, AlteraComentario]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tarefa']
    pagination_class = None
    queryset = Comentario.objects.select_related('autor')

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)