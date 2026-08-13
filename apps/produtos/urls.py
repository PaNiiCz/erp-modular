from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, MarcaViewSet, FornecedorViewSet, ProdutoViewSet

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'marcas', MarcaViewSet, basename='marca')
router.register(r'fornecedores', FornecedorViewSet, basename='fornecedor')
router.register(r'produtos', ProdutoViewSet, basename='produto')

urlpatterns = router.urls