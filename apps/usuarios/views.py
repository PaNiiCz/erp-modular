from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from .models import Usuario
from .serializers import UsuarioSerializer, AvatarSerializer
from .utils import gerador_token_email
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken


class CadastroView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        usuario = serializer.save()
        uid = urlsafe_base64_encode(force_bytes(usuario.pk))
        token = gerador_token_email.make_token(usuario)
        link = f"http://127.0.0.1:8000/api/usuarios/confirmar-email/{uid}/{token}/"

        send_mail(
            'Confirme seu e-mail',
            f'Clique no link para confirmar seu e-mail: {link}',
            'noreply@erpmodular.com',
            [usuario.email],
        )


class PerfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ConfirmarEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            usuario = Usuario.objects.get(pk=uid)
        except (Usuario.DoesNotExist, ValueError, TypeError):
            return Response({'erro': 'Link inválido.'}, status=400)

        if gerador_token_email.check_token(usuario, token):
            usuario.email_confirmado = True
            usuario.save()
            return Response({'mensagem': 'E-mail confirmado com sucesso!'})
        return Response({'erro': 'Token inválido ou expirado.'}, status=400)


class SolicitarRecuperacaoSenhaView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            return Response({'mensagem': 'Se o e-mail existir, um link foi enviado.'})

        uid = urlsafe_base64_encode(force_bytes(usuario.pk))
        token = default_token_generator.make_token(usuario)
        link = f"http://127.0.0.1:8000/api/usuarios/redefinir-senha/{uid}/{token}/"

        send_mail(
            'Redefinição de senha',
            f'Clique no link para redefinir sua senha: {link}',
            'noreply@erpmodular.com',
            [usuario.email],
        )
        return Response({'mensagem': 'Se o e-mail existir, um link foi enviado.'})


class RedefinirSenhaView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            usuario = Usuario.objects.get(pk=uid)
        except (Usuario.DoesNotExist, ValueError, TypeError):
            return Response({'erro': 'Link inválido.'}, status=400)

        if not default_token_generator.check_token(usuario, token):
            return Response({'erro': 'Token inválido ou expirado.'}, status=400)

        nova_senha = request.data.get('password')
        if not nova_senha or len(nova_senha) < 8:
            return Response({'erro': 'Senha deve ter pelo menos 8 caracteres.'}, status=400)

        usuario.set_password(nova_senha)
        usuario.save()
        return Response({'mensagem': 'Senha redefinida com sucesso!'})


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'mensagem': 'Logout realizado com sucesso!'})
        except Exception:
            return Response({'erro': 'Token inválido.'}, status=400)


class AvatarUploadView(generics.UpdateAPIView):
    serializer_class = AvatarSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user

class SessoesAtivasView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tokens_blacklistados = BlacklistedToken.objects.filter(
            token__user=request.user
        ).values_list('token_id', flat=True)

        sessoes = OutstandingToken.objects.filter(
            user=request.user
        ).exclude(id__in=tokens_blacklistados).order_by('-created_at')

        dados = [
            {
                'id': sessao.id,
                'criado_em': sessao.created_at,
                'expira_em': sessao.expires_at,
            }
            for sessao in sessoes
        ]
        return Response(dados)

class EncerrarSessaoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, sessao_id):
        try:
            token = OutstandingToken.objects.get(id=sessao_id, user=request.user)
        except OutstandingToken.DoesNotExist:
            return Response({'erro': 'Sessão não encontrada.'}, status=404)

        BlacklistedToken.objects.get_or_create(token=token)
        return Response({'mensagem': 'Sessão encerrada com sucesso!'})

from django.shortcuts import render


def teste_oauth(request):
    return render(request, 'teste_oauth.html')