from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import RegistroAtividade
from .permissions import AcessoAdministracao, tem_acesso_administracao
from .serializers import RegistroAtividadeSerializer, UsuarioAdminSerializer
from .services import registrar

User = get_user_model()


class Paginacao(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'tamanho'
    max_page_size = 100


def _encerrar_sessoes(usuario):
    """Invalida todos os refresh tokens do usuário (blacklist do SimpleJWT)."""
    try:
        from rest_framework_simplejwt.token_blacklist.models import (
            BlacklistedToken,
            OutstandingToken,
        )
    except Exception:
        return
    for token in OutstandingToken.objects.filter(user=usuario):
        BlacklistedToken.objects.get_or_create(token=token)


def _booleano(valor):
    return str(valor).lower() in ('1', 'true', 'sim')


class AcessoView(APIView):
    """Qualquer usuário logado pode perguntar se tem acesso (o menu usa isso)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'acesso': tem_acesso_administracao(request.user)})


class ResumoView(APIView):
    permission_classes = [AcessoAdministracao]

    def get(self, request):
        desde = timezone.now() - timedelta(hours=24)
        return Response({
            'usuarios_total': User.objects.count(),
            'usuarios_ativos': User.objects.filter(is_active=True).count(),
            'usuarios_inativos': User.objects.filter(is_active=False).count(),
            'administradores': User.objects.filter(Q(is_staff=True) | Q(is_superuser=True)).count(),
            'atividades_24h': RegistroAtividade.objects.filter(criado_em__gte=desde).count(),
        })


class UsuarioAdminViewSet(ReadOnlyModelViewSet):
    permission_classes = [AcessoAdministracao]
    serializer_class = UsuarioAdminSerializer
    pagination_class = Paginacao

    def get_queryset(self):
        qs = User.objects.all().order_by('username')
        if self.action != 'list':
            return qs
        params = self.request.query_params

        busca = params.get('search')
        if busca:
            qs = qs.filter(
                Q(username__icontains=busca)
                | Q(first_name__icontains=busca)
                | Q(last_name__icontains=busca)
                | Q(email__icontains=busca)
            )
        if params.get('ativo') not in (None, ''):
            qs = qs.filter(is_active=_booleano(params.get('ativo')))
        if params.get('admin') not in (None, ''):
            if _booleano(params.get('admin')):
                qs = qs.filter(Q(is_staff=True) | Q(is_superuser=True))
            else:
                qs = qs.filter(is_staff=False, is_superuser=False)
        return qs

    def _alterar(self, request, campo, valor, acao, descricao):
        alvo = self.get_object()
        ator = request.user

        if alvo.pk == ator.pk:
            return Response(
                {'detail': 'Você não pode alterar a sua própria conta.'}, status=400
            )
        if alvo.is_superuser and not ator.is_superuser:
            return Response(
                {'detail': 'Apenas um superusuário pode alterar outro superusuário.'},
                status=403,
            )

        # Se já está no estado pedido, não muda nada e não gera registro duplicado.
        if getattr(alvo, campo) != valor:
            nome = alvo.get_full_name() or alvo.get_username()
            with transaction.atomic():
                setattr(alvo, campo, valor)
                alvo.save(update_fields=[campo])
                if campo == 'is_active' and valor is False:
                    _encerrar_sessoes(alvo)
                registrar(ator, acao, f'{descricao} {nome}', alvo=alvo, request=request)

        return Response(UsuarioAdminSerializer(alvo).data)

    @action(detail=True, methods=['post'])
    def ativar(self, request, pk=None):
        return self._alterar(request, 'is_active', True, 'USUARIO_ATIVADO', 'Ativou o usuário')

    @action(detail=True, methods=['post'])
    def desativar(self, request, pk=None):
        return self._alterar(request, 'is_active', False, 'USUARIO_DESATIVADO', 'Desativou o usuário')

    @action(detail=True, methods=['post'], url_path='tornar-admin')
    def tornar_admin(self, request, pk=None):
        return self._alterar(
            request, 'is_staff', True, 'ADMIN_CONCEDIDO', 'Concedeu acesso de administração a'
        )

    @action(detail=True, methods=['post'], url_path='remover-admin')
    def remover_admin(self, request, pk=None):
        return self._alterar(
            request, 'is_staff', False, 'ADMIN_REMOVIDO', 'Removeu o acesso de administração de'
        )


class AtividadeViewSet(ReadOnlyModelViewSet):
    permission_classes = [AcessoAdministracao]
    serializer_class = RegistroAtividadeSerializer
    pagination_class = Paginacao

    def get_queryset(self):
        qs = RegistroAtividade.objects.all()
        params = self.request.query_params

        if params.get('usuario'):
            qs = qs.filter(usuario_id=params.get('usuario'))
        if params.get('acao'):
            qs = qs.filter(acao=params.get('acao'))

        for nome_param, filtro in (('de', 'criado_em__date__gte'), ('ate', 'criado_em__date__lte')):
            valor = params.get(nome_param)
            if valor:
                data = parse_date(valor)
                if data is None:
                    raise ValidationError({nome_param: 'Use o formato AAAA-MM-DD.'})
                qs = qs.filter(**{filtro: data})

        busca = params.get('search')
        if busca:
            qs = qs.filter(
                Q(descricao__icontains=busca)
                | Q(usuario_nome__icontains=busca)
                | Q(alvo_nome__icontains=busca)
            )
        return qs