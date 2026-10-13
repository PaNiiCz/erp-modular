from rest_framework.permissions import BasePermission


def tem_acesso_administracao(usuario):
    return bool(
        usuario
        and usuario.is_authenticated
        and usuario.is_active
        and (usuario.is_staff or usuario.is_superuser)
    )


class AcessoAdministracao(BasePermission):
    """Área restrita: só administração (is_staff ou superusuário)."""

    message = 'Acesso restrito à administração.'

    def has_permission(self, request, view):
        return tem_acesso_administracao(request.user)