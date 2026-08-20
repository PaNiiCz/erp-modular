from rest_framework.routers import DefaultRouter
from .views import CategoriaFinanceiraViewSet, LancamentoFinanceiroViewSet

router = DefaultRouter()
router.register(r'financeiro/categorias', CategoriaFinanceiraViewSet, basename='categoria-financeira')
router.register(r'financeiro/lancamentos', LancamentoFinanceiroViewSet, basename='lancamento-financeiro')

urlpatterns = router.urls