from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import RegistroAtividade

User = get_user_model()


class UsuarioAdminSerializer(serializers.ModelSerializer):
    nome_completo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'nome_completo', 'email',
            'is_active', 'is_staff', 'is_superuser',
            'last_login', 'date_joined',
        ]
        read_only_fields = fields

    def get_nome_completo(self, obj):
        return obj.get_full_name() or obj.get_username()


class RegistroAtividadeSerializer(serializers.ModelSerializer):
    acao_rotulo = serializers.CharField(source='get_acao_display', read_only=True)

    class Meta:
        model = RegistroAtividade
        fields = [
            'id', 'usuario', 'usuario_nome', 'acao', 'acao_rotulo',
            'descricao', 'alvo_tipo', 'alvo_id', 'alvo_nome', 'ip', 'criado_em',
        ]
        read_only_fields = fields