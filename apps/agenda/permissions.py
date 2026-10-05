from rest_framework.permissions import SAFE_METHODS, BasePermission


class ApenasDonoEdita(BasePermission):
    """Convidados podem ver o evento, mas só o dono altera ou exclui."""

    message = 'Somente quem criou o evento pode alterá-lo ou excluí-lo.'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.usuario_id == request.user.id