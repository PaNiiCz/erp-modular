from django.urls import path
from .views import (
    CadastroView, PerfilView, ConfirmarEmailView,
    SolicitarRecuperacaoSenhaView, RedefinirSenhaView,
    LogoutView, AvatarUploadView, SessoesAtivasView, EncerrarSessaoView, teste_oauth,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('cadastro/', CadastroView.as_view(), name='cadastro'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='login-refresh'),
    path('perfil/', PerfilView.as_view(), name='perfil'),
    path('confirmar-email/<uidb64>/<token>/', ConfirmarEmailView.as_view(), name='confirmar-email'),
    path('recuperar-senha/', SolicitarRecuperacaoSenhaView.as_view(), name='recuperar-senha'),
    path('redefinir-senha/<uidb64>/<token>/', RedefinirSenhaView.as_view(), name='redefinir-senha'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('avatar/', AvatarUploadView.as_view(), name='avatar'),
    path('sessoes/', SessoesAtivasView.as_view(), name='sessoes'),
    path('sessoes/<int:sessao_id>/encerrar/', EncerrarSessaoView.as_view(), name='encerrar-sessao'),
    path('teste-oauth/', teste_oauth, name='teste-oauth'),
]