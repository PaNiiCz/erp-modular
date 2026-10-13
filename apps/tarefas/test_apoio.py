from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()


class ApoioTests(APITestCase):
    def setUp(self):
        self.u = User.objects.create_user(
            username="apoio", email="apoio@teste.com", password="senha12345", is_staff=True
        )

    def test_sem_login_recebe_401(self):
        self.assertEqual(self.client.get("/api/apoio/eu/").status_code, 401)

    def test_eu(self):
        self.client.force_authenticate(self.u)
        r = self.client.get("/api/apoio/eu/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data["is_staff"])

    def test_setores_e_usuarios(self):
        self.client.force_authenticate(self.u)
        self.assertEqual(self.client.get("/api/apoio/setores/").status_code, 200)
        r = self.client.get("/api/apoio/usuarios/")
        self.assertEqual(r.status_code, 200)
        self.assertGreaterEqual(len(r.data), 1)