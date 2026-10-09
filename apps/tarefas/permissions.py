from rest_framework.permissions import SAFE_METHODS, BasePermission


def administra(usuario):
    return bool(usuario.is_staff or usuario.is_superuser)


def pode_alterar_tarefa(usuario, tarefa):
    """Quem criou, o responsável ou a administração."""
    return administra(usuario) or usuario.id in (tarefa.criado_por_id, tarefa.responsavel_id)


class AlteraTarefa(BasePermission):
    """Todos veem. Editar: criador, responsável ou administração. Excluir: criador ou administração."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.method == 'DELETE':
            return administra(request.user) or request.user.id == obj.criado_por_id
        return pode_alterar_tarefa(request.user, obj)


class AlteraProjeto(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return administra(request.user) or request.user.id == obj.criado_por_id


class AlteraItemChecklist(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return pode_alterar_tarefa(request.user, obj.tarefa)


class AlteraComentario(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return administra(request.user) or request.user.id == obj.autor_id