from rest_framework import serializers
from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'password', 'avatar', 'telefone', 'data_nascimento']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        senha = validated_data.pop('password')
        usuario = Usuario(**validated_data)
        usuario.set_password(senha)
        usuario.save()
        return usuario


class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['avatar']