from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Comunicado

User = get_user_model()
URL = "/api/comunicados/"


def itens(resposta):
    dados = resposta.data
    if isinstance(dados, dict) and "results" in dados:
        return dados["results"]
    return dados


class ComunicadosTests(APITestCase):
    def setUp(self):
        self.chefe = User.objects.create_user(
            username="chefe", email="chefe@teste.com", password="senha12345", is_staff=True
        )
        self.func = User.objects.create_user(
            username="func", email="func@teste.com", password="senha12345"
        )

    def test_sem_login_recebe_401(self):
        self.assertEqual(self.client.get(URL).status_code, 401)

    def test_chefe_publica(self):
        self.client.force_authenticate(self.chefe)
        r = self.client.post(
            URL, {"titulo": "Entrada às 8h", "texto": "Horário novo", "categoria": "ENTRADA"}
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["autor"], self.chefe.id)

    def test_funcionario_nao_publica(self):
        self.client.force_authenticate(self.func)
        r = self.client.post(URL, {"titulo": "X", "texto": "Y", "categoria": "GERAL"})
        self.assertEqual(r.status_code, 403)

    def test_categoria_invalida_recebe_400(self):
        self.client.force_authenticate(self.chefe)
        r = self.client.post(URL, {"titulo": "X", "texto": "Y", "categoria": "XYZ"})
        self.assertEqual(r.status_code, 400)

    def test_funcionario_lista(self):
        Comunicado.objects.create(titulo="A", texto="a", autor=self.chefe)
        self.client.force_authenticate(self.func)
        r = self.client.get(URL)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(itens(r)), 1)

    def test_funcionario_nao_edita_nem_exclui(self):
        c = Comunicado.objects.create(titulo="A", texto="a", autor=self.chefe)
        self.client.force_authenticate(self.func)
        self.assertEqual(self.client.patch(f"{URL}{c.id}/", {"titulo": "B"}).status_code, 403)
        self.assertEqual(self.client.delete(f"{URL}{c.id}/").status_code, 403)

    def test_chefe_edita_e_exclui(self):
        c = Comunicado.objects.create(titulo="A", texto="a", autor=self.chefe)
        self.client.force_authenticate(self.chefe)
        self.assertEqual(self.client.patch(f"{URL}{c.id}/", {"titulo": "B"}).status_code, 200)
        self.assertEqual(self.client.delete(f"{URL}{c.id}/").status_code, 204)

    def test_fixado_aparece_primeiro(self):
        Comunicado.objects.create(titulo="Comum", texto="a", autor=self.chefe)
        Comunicado.objects.create(titulo="Fixado", texto="b", autor=self.chefe, fixado=True)
        Comunicado.objects.create(titulo="Comum 2", texto="c", autor=self.chefe)
        self.client.force_authenticate(self.func)
        r = self.client.get(URL)
        self.assertEqual(itens(r)[0]["titulo"], "Fixado")

    def test_filtro_por_categoria(self):
        Comunicado.objects.create(titulo="E", texto="a", autor=self.chefe, categoria="ENTREGA")
        Comunicado.objects.create(titulo="G", texto="b", autor=self.chefe, categoria="GERAL")
        self.client.force_authenticate(self.func)
        r = self.client.get(URL + "?categoria=ENTREGA")
        self.assertEqual(len(itens(r)), 1)
        self.assertEqual(itens(r)[0]["titulo"], "E")

    def test_marcar_lido_e_contador(self):
        c = Comunicado.objects.create(titulo="A", texto="a", autor=self.chefe)
        self.client.force_authenticate(self.func)
        self.assertEqual(self.client.get(URL + "nao-lidos/").data["total"], 1)
        self.assertEqual(self.client.post(f"{URL}{c.id}/marcar-lido/").status_code, 200)
        self.assertEqual(self.client.get(URL + "nao-lidos/").data["total"], 0)
        self.assertTrue(self.client.get(f"{URL}{c.id}/").data["lido"])

    def test_marcar_lido_duas_vezes_nao_duplica(self):
        c = Comunicado.objects.create(titulo="A", texto="a", autor=self.chefe)
        self.client.force_authenticate(self.func)
        self.client.post(f"{URL}{c.id}/marcar-lido/")
        self.client.post(f"{URL}{c.id}/marcar-lido/")
        self.assertEqual(c.leituras.count(), 1)

    def test_so_chefia_ve_quem_leu(self):
        c = Comunicado.objects.create(titulo="A", texto="a", autor=self.chefe)
        self.client.force_authenticate(self.func)
        self.client.post(f"{URL}{c.id}/marcar-lido/")
        self.assertEqual(self.client.get(f"{URL}{c.id}/leituras/").status_code, 403)
        self.client.force_authenticate(self.chefe)
        r = self.client.get(f"{URL}{c.id}/leituras/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 1)