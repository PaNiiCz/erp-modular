from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from rest_framework import serializers

from .models import Evento, Lembrete, Notificacao

User = get_user_model()


def _area_do_usuario(usuario):
    """Procura a área do funcionário no módulo de RH.

    Olha o cadastro de RH ligado ao usuário e devolve o primeiro destes campos
    que estiver preenchido: departamento, area, setor ou cargo.
    Se não achar nada, devolve texto vazio.
    """
    for relacao in usuario._meta.related_objects:
        if relacao.related_model._meta.app_label != 'rh':
            continue
        try:
            cadastro = getattr(usuario, relacao.get_accessor_name())
            if hasattr(cadastro, 'first'):  # relação de um-para-muitos
                cadastro = cadastro.first()
        except ObjectDoesNotExist:
            continue
        if cadastro is None:
            continue
        for campo in ('departamento', 'area', 'setor', 'cargo'):
            valor = getattr(cadastro, campo, None)
            if valor:
                return str(valor)
    return ''


class UsuarioSimplesSerializer(serializers.ModelSerializer):
    nome = serializers.SerializerMethodField()
    area = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'nome', 'area']

    def get_nome(self, obj):
        return str(obj)

    def get_area(self, obj):
        return _area_do_usuario(obj)


class EventoSerializer(serializers.ModelSerializer):
    participantes = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.filter(is_active=True),
        required=False,
    )
    # Lista de "minutos antes" para os lembretes. Só entra na gravação;
    # na leitura ela é preenchida no to_representation.
    lembretes_minutos = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=10080),
        required=False,
        write_only=True,
    )
    dono_nome = serializers.SerializerMethodField()
    participantes_nomes = serializers.SerializerMethodField()
    pode_editar = serializers.SerializerMethodField()

    class Meta:
        model = Evento
        fields = [
            'id', 'titulo', 'descricao', 'local', 'tipo', 'status',
            'inicio', 'fim', 'dia_inteiro', 'cor',
            'usuario', 'dono_nome', 'participantes', 'participantes_nomes',
            'lembretes_minutos', 'pode_editar', 'criado_em', 'atualizado_em',
        ]
        read_only_fields = ['usuario', 'status', 'criado_em', 'atualizado_em']

    def get_dono_nome(self, obj):
        return str(obj.usuario)

    def get_participantes_nomes(self, obj):
        return [str(p) for p in obj.participantes.all()]

    def get_pode_editar(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.id == obj.usuario_id)

    def to_representation(self, instance):
        dados = super().to_representation(instance)
        dados['lembretes_minutos'] = sorted(l.minutos_antes for l in instance.lembretes.all())
        return dados

    def validate(self, attrs):
        inicio = attrs.get('inicio', getattr(self.instance, 'inicio', None))
        fim = attrs.get('fim', getattr(self.instance, 'fim', None))
        if inicio and fim and fim < inicio:
            raise serializers.ValidationError('A data/hora final não pode ser anterior à inicial.')

        # O dono não precisa ser convidado do próprio evento
        if 'participantes' in attrs:
            dono = self.instance.usuario if self.instance else self.context['request'].user
            attrs['participantes'] = [p for p in attrs['participantes'] if p.pk != dono.pk]

        return attrs

    def _salvar_lembretes(self, evento, minutos, reiniciar=False):
        novos = set(minutos)
        evento.lembretes.exclude(minutos_antes__in=novos).delete()
        existentes = set(evento.lembretes.values_list('minutos_antes', flat=True))
        Lembrete.objects.bulk_create(
            [Lembrete(evento=evento, minutos_antes=m) for m in novos - existentes]
        )
        if reiniciar:
            # Se o horário do evento mudou, os avisos valem de novo
            evento.lembretes.update(notificado=False)

    def _notificar_convites(self, evento, convidados):
        Notificacao.objects.bulk_create(
            [
                Notificacao(
                    usuario=pessoa,
                    evento=evento,
                    titulo=f'Convite: {evento.titulo}',
                    mensagem=f'{evento.usuario} convidou você para este evento.',
                )
                for pessoa in convidados
            ]
        )

    @transaction.atomic
    def create(self, validated_data):
        minutos = validated_data.pop('lembretes_minutos', [])
        participantes = validated_data.pop('participantes', [])
        evento = Evento.objects.create(**validated_data)
        evento.participantes.set(participantes)
        self._salvar_lembretes(evento, minutos)
        self._notificar_convites(evento, participantes)
        return evento

    @transaction.atomic
    def update(self, instance, validated_data):
        minutos = validated_data.pop('lembretes_minutos', None)
        participantes = validated_data.pop('participantes', None)
        inicio_antigo = instance.inicio

        evento = super().update(instance, validated_data)

        if participantes is not None:
            antigos = set(evento.participantes.values_list('pk', flat=True))
            evento.participantes.set(participantes)
            self._notificar_convites(evento, [p for p in participantes if p.pk not in antigos])

        if minutos is None:
            minutos = list(evento.lembretes.values_list('minutos_antes', flat=True))
        self._salvar_lembretes(evento, minutos, reiniciar=evento.inicio != inicio_antigo)

        return evento


class NotificacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacao
        fields = ['id', 'titulo', 'mensagem', 'lida', 'evento', 'criada_em']
        read_only_fields = fields