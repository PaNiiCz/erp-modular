from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Comunicado, Leitura
from .serializers import ComunicadoSerializer, LeituraSerializer


class SoChefiaPublica(permissions.BasePermission):
    """Todos os logados veem e marcam como lido. Só is_staff publica,
    edita, exclui e vê quem leu."""

    acoes_liberadas = ("list", "retrieve", "marcar_lido", "nao_lidos")

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if view.action in self.acoes_liberadas:
            return True
        return request.user.is_staff


class ComunicadoViewSet(viewsets.ModelViewSet):
    serializer_class = ComunicadoSerializer
    permission_classes = [SoChefiaPublica]

    def get_queryset(self):
        qs = Comunicado.objects.select_related("autor")
        categoria = self.request.query_params.get("categoria")
        fixado = self.request.query_params.get("fixado")
        if categoria:
            qs = qs.filter(categoria=categoria)
        if fixado in ("true", "false"):
            qs = qs.filter(fixado=(fixado == "true"))
        return qs

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)

    @action(detail=True, methods=["post"], url_path="marcar-lido")
    def marcar_lido(self, request, pk=None):
        comunicado = self.get_object()
        Leitura.objects.get_or_create(comunicado=comunicado, usuario=request.user)
        return Response({"lido": True})

    @action(detail=False, methods=["get"], url_path="nao-lidos")
    def nao_lidos(self, request):
        total = Comunicado.objects.exclude(leituras__usuario=request.user).count()
        return Response({"total": total})

    @action(detail=True, methods=["get"])
    def leituras(self, request, pk=None):
        comunicado = self.get_object()
        leituras = comunicado.leituras.select_related("usuario")
        return Response(LeituraSerializer(leituras, many=True).data)