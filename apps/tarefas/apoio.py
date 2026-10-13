from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.rh.models import Departamento


def nome_do_usuario(usuario):
    return usuario.get_full_name() or usuario.get_username()


class EuView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        return Response(
            {"id": u.id, "nome": nome_do_usuario(u), "is_staff": u.is_staff}
        )


class SetoresView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        dados = [
            {"id": d.id, "nome": getattr(d, "nome", None) or str(d)}
            for d in Departamento.objects.all()
        ]
        return Response(dados)


class UsuariosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuarios = get_user_model().objects.filter(is_active=True).order_by(
            "first_name", "username"
        )
        return Response([{"id": u.id, "nome": nome_do_usuario(u)} for u in usuarios])