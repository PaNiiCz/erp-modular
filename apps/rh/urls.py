from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AcessoRHView,
    CargoViewSet,
    DepartamentoViewSet,
    DocumentoFuncionarioViewSet,
    EscalaViewSet,
    FeriasViewSet,
    FuncionarioViewSet,
)

router = DefaultRouter()
router.register('departamentos', DepartamentoViewSet, basename='departamento')
router.register('cargos', CargoViewSet, basename='cargo')
router.register('funcionarios', FuncionarioViewSet, basename='funcionario')
router.register('ferias', FeriasViewSet, basename='ferias')
router.register('escalas', EscalaViewSet, basename='escala')
router.register('documentos', DocumentoFuncionarioViewSet, basename='documento')

urlpatterns = [
    path('acesso/', AcessoRHView.as_view(), name='rh-acesso'),
] + router.urls