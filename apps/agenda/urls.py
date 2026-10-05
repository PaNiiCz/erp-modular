from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import EventoViewSet, NotificacaoViewSet, UsuarioListView

router = DefaultRouter()
router.register('eventos', EventoViewSet, basename='evento')
router.register('notificacoes', NotificacaoViewSet, basename='notificacao')

urlpatterns = [
    path('usuarios/', UsuarioListView.as_view(), name='agenda-usuarios'),
] + router.urls