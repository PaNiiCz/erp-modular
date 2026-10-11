from rest_framework import serializers

from .models import Comunicado, Leitura


class ComunicadoSerializer(serializers.ModelSerializer):
    autor_nome = serializers.SerializerMethodField()
    lido = serializers.SerializerMethodField()
    total_leituras = serializers.SerializerMethodField()

    class Meta:
        model = Comunicado
        fields = [
            "id",
            "titulo",
            "texto",
            "categoria",
            "fixado",
            "autor",
            "autor_nome",
            "lido",
            "total_leituras",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["autor", "criado_em", "atualizado_em"]

    def get_autor_nome(self, obj):
        if obj.autor is None:
            return ""
        return obj.autor.get_full_name() or obj.autor.get_username()

    def get_lido(self, obj):
        usuario = self.context["request"].user
        return obj.leituras.filter(usuario=usuario).exists()

    def get_total_leituras(self, obj):
        return obj.leituras.count()


class LeituraSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.SerializerMethodField()

    class Meta:
        model = Leitura
        fields = ["usuario", "usuario_nome", "lida_em"]

    def get_usuario_nome(self, obj):
        return obj.usuario.get_full_name() or obj.usuario.get_username()