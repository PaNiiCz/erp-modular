from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import AcessoView, AtividadeViewSet, ResumoView, UsuarioAdminViewSet

router = SimpleRouter()
router.register('usuarios', UsuarioAdminViewSet, basename='admin-usuarios')
router.register('atividades', AtividadeViewSet, basename='admin-atividades')

urlpatterns = [
    path('acesso/', AcessoView.as_view()),
    path('resumo/', ResumoView.as_view()),
    path('', include(router.urls)),
]