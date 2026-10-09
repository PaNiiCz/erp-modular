from django.utils import timezone
from rest_framework import serializers

from .models import Comentario, ItemChecklist, Projeto, Tarefa
from .permissions import administra, pode_alterar_tarefa


class ProjetoSerializer(serializers.ModelSerializer):
    criado_por_nome = serializers.SerializerMethodField()
    total_tarefas = serializers.SerializerMethodField()
    tarefas_concluidas = serializers.SerializerMethodField()
    pode_editar = serializers.SerializerMethodField()

    class Meta:
        model = Projeto
        fields = [
            'id', 'nome', 'descricao', 'cor', 'arquivado',
            'criado_por', 'criado_por_nome', 'total_tarefas', 'tarefas_concluidas',
            'pode_editar', 'criado_em',
        ]
        read_only_fields = ['criado_por', 'criado_em']

    def get_criado_por_nome(self, obj):
        return str(obj.criado_por) if obj.criado_por_id else ''

    def get_total_tarefas(self, obj):
        valor = getattr(obj, 'total_tarefas', None)
        return valor if valor is not None else obj.tarefas.count()

    def get_tarefas_concluidas(self, obj):
        valor = getattr(obj, 'tarefas_concluidas', None)
        if valor is not None:
            return valor
        return obj.tarefas.filter(status=Tarefa.Status.CONCLUIDA).count()

    def get_pode_editar(self, obj):
        request = self.context.get('request')
        return bool(request and (administra(request.user) or request.user.id == obj.criado_por_id))


class ItemChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemChecklist
        fields = ['id', 'tarefa', 'texto', 'concluido', 'ordem']


class TarefaSerializer(serializers.ModelSerializer):
    projeto_nome = serializers.SerializerMethodField()
    criado_por_nome = serializers.SerializerMethodField()
    responsavel_nome = serializers.SerializerMethodField()
    setor_nome = serializers.SerializerMethodField()
    atrasada = serializers.SerializerMethodField()
    checklist = ItemChecklistSerializer(many=True, read_only=True)
    checklist_total = serializers.SerializerMethodField()
    checklist_feitos = serializers.SerializerMethodField()
    total_comentarios = serializers.SerializerMethodField()
    pode_editar = serializers.SerializerMethodField()

    class Meta:
        model = Tarefa
        fields = [
            'id', 'projeto', 'projeto_nome', 'titulo', 'descricao', 'tipo', 'status', 'prioridade',
            'criado_por', 'criado_por_nome', 'responsavel', 'responsavel_nome',
            'setor_destino', 'setor_nome', 'prazo', 'atrasada', 'concluida_em', 'ordem',
            'checklist', 'checklist_total', 'checklist_feitos', 'total_comentarios',
            'pode_editar', 'criado_em', 'atualizado_em',
        ]
        read_only_fields = ['criado_por', 'concluida_em', 'criado_em', 'atualizado_em']

    def get_projeto_nome(self, obj):
        return str(obj.projeto) if obj.projeto_id else ''

    def get_criado_por_nome(self, obj):
        return str(obj.criado_por) if obj.criado_por_id else ''

    def get_responsavel_nome(self, obj):
        return str(obj.responsavel) if obj.responsavel_id else ''

    def get_setor_nome(self, obj):
        return str(obj.setor_destino) if obj.setor_destino_id else ''

    def get_atrasada(self, obj):
        return bool(obj.prazo and obj.status != Tarefa.Status.CONCLUIDA and obj.prazo < timezone.localdate())

    def get_checklist_total(self, obj):
        return len(obj.checklist.all())

    def get_checklist_feitos(self, obj):
        return sum(1 for item in obj.checklist.all() if item.concluido)

    def get_total_comentarios(self, obj):
        valor = getattr(obj, 'total_comentarios', None)
        return valor if valor is not None else obj.comentarios.count()

    def get_pode_editar(self, obj):
        request = self.context.get('request')
        return bool(request and pode_alterar_tarefa(request.user, obj))

    def validate(self, attrs):
        def valor(campo):
            if campo in attrs:
                return attrs[campo]
            return getattr(self.instance, campo, None) if self.instance else None

        if valor('tipo') == Tarefa.Tipo.SOLICITACAO and not (valor('setor_destino') or valor('responsavel')):
            raise serializers.ValidationError(
                'Informe o setor de destino ou um responsável para a solicitação.'
            )
        return attrs


class ComentarioSerializer(serializers.ModelSerializer):
    autor_nome = serializers.SerializerMethodField()
    pode_apagar = serializers.SerializerMethodField()

    class Meta:
        model = Comentario
        fields = ['id', 'tarefa', 'autor', 'autor_nome', 'texto', 'pode_apagar', 'criado_em']
        read_only_fields = ['autor', 'criado_em']

    def get_autor_nome(self, obj):
        return str(obj.autor) if obj.autor_id else ''

    def get_pode_apagar(self, obj):
        request = self.context.get('request')
        return bool(request and (administra(request.user) or request.user.id == obj.autor_id))