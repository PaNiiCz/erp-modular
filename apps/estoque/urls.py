from rest_framework.routers import DefaultRouter
from .views import EstoqueViewSet, MovimentacaoEstoqueViewSet

router = DefaultRouter()
router.register(r'estoque', EstoqueViewSet, basename='estoque')
router.register(r'movimentacoes', MovimentacaoEstoqueViewSet, basename='movimentacao')

urlpatterns = router.urls