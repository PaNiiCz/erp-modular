from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import RegistroAtividade

User = get_user_model()
LOGIN = '/api/usuarios/login/'
LOGOUT = '/api/usuarios/logout/'


class AuditoriaLoginTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('ana', 'ana@x.com', 'Senha123!')

    def _login(self, senha='Senha123!'):
        return self.client.post(LOGIN, {'username': 'ana', 'password': senha}, format='json')

    def test_login_ok_registra_entrada(self):
        r = self._login()
        self.assertEqual(r.status_code, 200)
        self.assertIn('access', r.data)
        reg = RegistroAtividade.objects.get(acao='LOGIN')
        self.assertEqual(reg.usuario, self.user)
        self.assertEqual(reg.usuario_nome, 'ana')

    def test_login_recusado_registra_falha(self):
        r = self._login(senha='errada')
        self.assertEqual(r.status_code, 401)
        reg = RegistroAtividade.objects.get(acao='LOGIN_FALHA')
        self.assertIsNone(reg.usuario)
        self.assertIn('ana', reg.descricao)
        self.assertFalse(RegistroAtividade.objects.filter(acao='LOGIN').exists())

    def test_logout_registra_saida(self):
        tokens = self._login().data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        r = self.client.post(LOGOUT, {'refresh': tokens['refresh']}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(RegistroAtividade.objects.filter(acao='LOGOUT', usuario=self.user).exists())