from rest_framework.routers import DefaultRouter

from .views import ComentarioViewSet, ItemChecklistViewSet, ProjetoViewSet, TarefaViewSet

router = DefaultRouter()
router.register('projetos', ProjetoViewSet, basename='projeto')
router.register('tarefas', TarefaViewSet, basename='tarefa')
router.register('checklist', ItemChecklistViewSet, basename='item-checklist')
router.register('comentarios', ComentarioViewSet, basename='comentario')

urlpatterns = router.urls