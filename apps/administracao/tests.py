from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken

from .models import RegistroAtividade
from .services import registrar

User = get_user_model()
BASE = '/api/administracao'


class AdministracaoTests(APITestCase):
    def setUp(self):
        self.dono = User.objects.create_superuser('dono', 'dono@x.com', 'Senha123!')
        self.admin = User.objects.create_user('admin1', 'admin1@x.com', 'Senha123!', is_staff=True)
        self.comum = User.objects.create_user('comum1', 'comum1@x.com', 'Senha123!')
        self.inativo = User.objects.create_user('inativo1', 'inativo1@x.com', 'Senha123!', is_active=False)

    # ---------- acesso ----------
    def test_acesso_flag(self):
        self.client.force_authenticate(self.comum)
        self.assertFalse(self.client.get(f'{BASE}/acesso/').data['acesso'])
        self.client.force_authenticate(self.admin)
        self.assertTrue(self.client.get(f'{BASE}/acesso/').data['acesso'])

    def test_comum_bloqueado(self):
        self.client.force_authenticate(self.comum)
        for rota in ('usuarios/', 'atividades/', 'resumo/'):
            self.assertEqual(self.client.get(f'{BASE}/{rota}').status_code, 403, rota)

    def test_comum_nao_executa_acoes(self):
        self.client.force_authenticate(self.comum)
        r = self.client.post(f'{BASE}/usuarios/{self.admin.pk}/desativar/')
        self.assertEqual(r.status_code, 403)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_anonimo_401(self):
        self.assertEqual(self.client.get(f'{BASE}/usuarios/').status_code, 401)
        self.assertEqual(self.client.get(f'{BASE}/acesso/').status_code, 401)

    # ---------- listagem ----------
    def test_lista_usuarios(self):
        self.client.force_authenticate(self.admin)
        r = self.client.get(f'{BASE}/usuarios/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['count'], 4)

    def test_busca_e_filtros(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get(f'{BASE}/usuarios/?search=comum').data['count'], 1)
        self.assertEqual(self.client.get(f'{BASE}/usuarios/?ativo=false').data['count'], 1)
        self.assertEqual(self.client.get(f'{BASE}/usuarios/?admin=true').data['count'], 2)

    # ---------- ações ----------
    def test_desativar_e_ativar(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(f'{BASE}/usuarios/{self.comum.pk}/desativar/')
        self.assertEqual(r.status_code, 200)
        self.comum.refresh_from_db()
        self.assertFalse(self.comum.is_active)

        r = self.client.post(f'{BASE}/usuarios/{self.comum.pk}/ativar/')
        self.assertEqual(r.status_code, 200)
        self.comum.refresh_from_db()
        self.assertTrue(self.comum.is_active)
        self.assertEqual(RegistroAtividade.objects.count(), 2)

    def test_tornar_e_remover_admin(self):
        self.client.force_authenticate(self.admin)
        self.client.post(f'{BASE}/usuarios/{self.comum.pk}/tornar-admin/')
        self.comum.refresh_from_db()
        self.assertTrue(self.comum.is_staff)

        self.client.post(f'{BASE}/usuarios/{self.comum.pk}/remover-admin/')
        self.comum.refresh_from_db()
        self.assertFalse(self.comum.is_staff)

    def test_nao_altera_a_si_mesmo(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(f'{BASE}/usuarios/{self.admin.pk}/desativar/')
        self.assertEqual(r.status_code, 400)
        r = self.client.post(f'{BASE}/usuarios/{self.admin.pk}/remover-admin/')
        self.assertEqual(r.status_code, 400)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active and self.admin.is_staff)

    def test_staff_nao_altera_superusuario(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(f'{BASE}/usuarios/{self.dono.pk}/desativar/')
        self.assertEqual(r.status_code, 403)
        self.dono.refresh_from_db()
        self.assertTrue(self.dono.is_active)

    def test_superusuario_altera_staff(self):
        self.client.force_authenticate(self.dono)
        r = self.client.post(f'{BASE}/usuarios/{self.admin.pk}/desativar/')
        self.assertEqual(r.status_code, 200)
        self.admin.refresh_from_db()
        self.assertFalse(self.admin.is_active)

    def test_desativado_perde_acesso(self):
        refresh = RefreshToken.for_user(self.comum)
        token = f'Bearer {refresh.access_token}'

        self.client.credentials(HTTP_AUTHORIZATION=token)
        self.assertEqual(self.client.get(f'{BASE}/acesso/').status_code, 200)

        self.client.credentials()
        self.client.force_authenticate(self.admin)
        self.client.post(f'{BASE}/usuarios/{self.comum.pk}/desativar/')

        self.client.force_authenticate(None)
        self.client.credentials(HTTP_AUTHORIZATION=token)
        self.assertEqual(self.client.get(f'{BASE}/acesso/').status_code, 401)
        self.assertTrue(BlacklistedToken.objects.filter(token__user=self.comum).exists())

    # ---------- auditoria ----------
    def test_acao_repetida_nao_duplica_log(self):
        self.client.force_authenticate(self.admin)
        self.client.post(f'{BASE}/usuarios/{self.comum.pk}/desativar/')
        self.client.post(f'{BASE}/usuarios/{self.comum.pk}/desativar/')
        self.assertEqual(RegistroAtividade.objects.count(), 1)

    def test_atividades_lista_e_filtros(self):
        self.client.force_authenticate(self.admin)
        self.client.post(f'{BASE}/usuarios/{self.comum.pk}/desativar/')
        self.client.post(f'{BASE}/usuarios/{self.comum.pk}/ativar/')

        r = self.client.get(f'{BASE}/atividades/')
        self.assertEqual(r.data['count'], 2)
        self.assertEqual(self.client.get(f'{BASE}/atividades/?acao=USUARIO_DESATIVADO').data['count'], 1)
        self.assertEqual(self.client.get(f'{BASE}/atividades/?usuario={self.admin.pk}').data['count'], 2)
        self.assertEqual(self.client.get(f'{BASE}/atividades/?de=2999-01-01').data['count'], 0)
        self.assertEqual(self.client.get(f'{BASE}/atividades/?de=lixo').status_code, 400)

        primeiro = r.data['results'][0]
        self.assertEqual(primeiro['usuario_nome'], 'admin1')
        self.assertEqual(primeiro['alvo_nome'], 'comum1')

    def test_resumo(self):
        self.client.force_authenticate(self.admin)
        r = self.client.get(f'{BASE}/resumo/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['usuarios_total'], 4)
        self.assertEqual(r.data['usuarios_ativos'], 3)
        self.assertEqual(r.data['usuarios_inativos'], 1)
        self.assertEqual(r.data['administradores'], 2)

    def test_registrar_sem_request(self):
        reg = registrar(self.admin, 'TESTE', 'Fez algo', alvo=self.comum)
        self.assertEqual(reg.usuario_nome, 'admin1')
        self.assertEqual(reg.alvo_tipo, 'User' if User.__name__ == 'User' else User.__name__)
        self.assertIsNone(reg.ip)