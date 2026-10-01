from rest_framework.permissions import BasePermission

NOME_GRUPO_RH = 'RH'


class AcessoRH(BasePermission):
    """Libera o módulo de RH só para superusuários, equipe (is_staff) ou o grupo 'RH'."""

    message = 'Você não tem permissão para acessar o módulo de RH.'

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
            return True

        if hasattr(user, 'groups'):
            return user.groups.filter(name=NOME_GRUPO_RH).exists()

        return False