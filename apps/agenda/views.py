from datetime import datetime, time

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Evento, Notificacao
from .permissions import ApenasDonoEdita
from .serializers import EventoSerializer, NotificacaoSerializer, UsuarioSimplesSerializer
from .services import gerar_notificacoes_pendentes

User = get_user_model()


def _limite(valor, fim_do_dia):
    """Converte '2026-10-05' ou '2026-10-05T10:00:00Z' em datetime com fuso."""
    if not valor:
        return None
    momento = parse_datetime(valor)
    if momento is None:
        dia = parse_date(valor)
        if dia is None:
            return None
        momento = datetime.combine(dia, time.max if fim_do_dia else time.min)
    if timezone.is_naive(momento):
        momento = timezone.make_aware(momento)
    return momento


class EventoViewSet(viewsets.ModelViewSet):
    serializer_class = EventoSerializer
    permission_classes = [IsAuthenticated, ApenasDonoEdita]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tipo']
    search_fields = ['titulo', 'descricao', 'local']
    ordering_fields = ['inicio', 'fim']

    def get_queryset(self):
        usuario = self.request.user
        consulta = (
            Evento.objects.filter(Q(usuario=usuario) | Q(participantes=usuario))
            .select_related('usuario')
            .prefetch_related('participantes', 'lembretes')
            .distinct()
        )

        # Calendário: eventos que encostam no período de/ate
        de = _limite(self.request.query_params.get('de'), fim_do_dia=False)
        ate = _limite(self.request.query_params.get('ate'), fim_do_dia=True)
        if de:
            consulta = consulta.filter(fim__gte=de)
        if ate:
            consulta = consulta.filter(inicio__lte=ate)
        return consulta

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    def _mudar_status(self, novo_status):
        evento = self.get_object()  # já confere se é o dono
        if evento.status != Evento.Status.AGENDADO:
            return Response(
                {'detail': f'Este evento já está "{evento.get_status_display()}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        evento.status = novo_status
        evento.save(update_fields=['status', 'atualizado_em'])
        return Response(self.get_serializer(evento).data)

    @action(detail=True, methods=['post'])
    def concluir(self, request, pk=None):
        return self._mudar_status(Evento.Status.CONCLUIDO)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        return self._mudar_status(Evento.Status.CANCELADO)

    @action(detail=False, methods=['get'])
    def proximos(self, request):
        """Os próximos 5 eventos agendados (útil para o Dashboard)."""
        eventos = (
            self.get_queryset()
            .filter(status=Evento.Status.AGENDADO, fim__gte=timezone.now())
            .order_by('inicio')[:5]
        )
        return Response(self.get_serializer(eventos, many=True).data)


class NotificacaoViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificacaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['lida']

    def get_queryset(self):
        return Notificacao.objects.filter(usuario=self.request.user)

    def list(self, request, *args, **kwargs):
        gerar_notificacoes_pendentes(request.user)
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def contador(self, request):
        gerar_notificacoes_pendentes(request.user)
        return Response({'nao_lidas': self.get_queryset().filter(lida=False).count()})

    @action(detail=True, methods=['post'], url_path='marcar-lida')
    def marcar_lida(self, request, pk=None):
        notificacao = self.get_object()
        notificacao.lida = True
        notificacao.save(update_fields=['lida'])
        return Response(self.get_serializer(notificacao).data)

    @action(detail=False, methods=['post'], url_path='marcar-todas-lidas')
    def marcar_todas_lidas(self, request):
        atualizadas = self.get_queryset().filter(lida=False).update(lida=True)
        return Response({'atualizadas': atualizadas})


class UsuarioListView(generics.ListAPIView):
    """Lista simples de usuários ativos, para escolher os convidados de um evento."""

    serializer_class = UsuarioSimplesSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return User.objects.filter(is_active=True).order_by(User.USERNAME_FIELD)