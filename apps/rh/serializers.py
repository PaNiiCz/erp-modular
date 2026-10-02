import os

from rest_framework import serializers
from rest_framework.reverse import reverse
from rest_framework.validators import UniqueTogetherValidator, UniqueValidator

from .models import Cargo, Departamento, DocumentoFuncionario, Escala, Ferias, Funcionario
from .validators import validar_cpf

EXTENSOES_PERMITIDAS = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'}
TAMANHO_MAXIMO_MB = 5


class DepartamentoSerializer(serializers.ModelSerializer):
    total_funcionarios = serializers.IntegerField(source='funcionarios.count', read_only=True)

    class Meta:
        model = Departamento
        fields = ['id', 'nome', 'descricao', 'ativo', 'total_funcionarios', 'criado_em']
        read_only_fields = ['criado_em']
        extra_kwargs = {
            'nome': {
                'validators': [
                    UniqueValidator(
                        queryset=Departamento.objects.all(),
                        message='Já existe um departamento com este nome.',
                    )
                ]
            }
        }


class CargoSerializer(serializers.ModelSerializer):
    departamento_nome = serializers.CharField(source='departamento.nome', read_only=True, default=None)

    class Meta:
        model = Cargo
        fields = [
            'id', 'nome', 'departamento', 'departamento_nome',
            'descricao', 'salario_base', 'ativo', 'criado_em',
        ]
        read_only_fields = ['criado_em']
        validators = [
            UniqueTogetherValidator(
                queryset=Cargo.objects.all(),
                fields=['nome', 'departamento'],
                message='Já existe um cargo com este nome neste departamento.',
            )
        ]


class FuncionarioSerializer(serializers.ModelSerializer):
    cargo_nome = serializers.CharField(source='cargo.nome', read_only=True)
    departamento_nome = serializers.CharField(source='departamento.nome', read_only=True)

    class Meta:
        model = Funcionario
        fields = [
            'id', 'nome', 'cpf', 'email', 'telefone',
            'data_nascimento', 'data_admissao', 'data_demissao',
            'cargo', 'cargo_nome', 'departamento', 'departamento_nome',
            'salario', 'status', 'usuario', 'criado_em', 'atualizado_em',
        ]
        read_only_fields = ['criado_em', 'atualizado_em']
        extra_kwargs = {
            'salario': {'required': False},
            'cpf': {
                'validators': [
                    validar_cpf,
                    UniqueValidator(
                        queryset=Funcionario.objects.all(),
                        message='Já existe um funcionário cadastrado com este CPF.',
                    ),
                ]
            },
            'email': {
                'validators': [
                    UniqueValidator(
                        queryset=Funcionario.objects.all(),
                        message='Já existe um funcionário cadastrado com este e-mail.',
                    )
                ]
            },
        }

    def to_internal_value(self, data):
        # Aceita CPF com máscara (123.456.789-09) e guarda só os números
        data = data.copy()
        cpf = data.get('cpf')
        if isinstance(cpf, str):
            data['cpf'] = ''.join(c for c in cpf if c.isdigit())
        return super().to_internal_value(data)

    def validate(self, attrs):
        cargo = attrs.get('cargo', getattr(self.instance, 'cargo', None))
        departamento = attrs.get('departamento', getattr(self.instance, 'departamento', None))
        admissao = attrs.get('data_admissao', getattr(self.instance, 'data_admissao', None))
        demissao = attrs.get('data_demissao', getattr(self.instance, 'data_demissao', None))

        if cargo and cargo.departamento_id and departamento and cargo.departamento_id != departamento.id:
            raise serializers.ValidationError('Este cargo pertence a outro departamento.')

        if admissao and demissao and demissao < admissao:
            raise serializers.ValidationError('A data de demissão não pode ser anterior à admissão.')

        # Se o salário não foi informado, usa o salário base do cargo
        if not self.instance and 'salario' not in attrs and cargo:
            attrs['salario'] = cargo.salario_base

        return attrs


class FeriasSerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.CharField(source='funcionario.nome', read_only=True)
    dias = serializers.IntegerField(read_only=True)

    class Meta:
        model = Ferias
        fields = [
            'id', 'funcionario', 'funcionario_nome', 'data_inicio', 'data_fim',
            'dias', 'status', 'observacoes', 'criado_em',
        ]
        read_only_fields = ['status', 'criado_em']

    def validate(self, attrs):
        funcionario = attrs.get('funcionario', getattr(self.instance, 'funcionario', None))
        inicio = attrs.get('data_inicio', getattr(self.instance, 'data_inicio', None))
        fim = attrs.get('data_fim', getattr(self.instance, 'data_fim', None))

        if inicio and fim and fim < inicio:
            raise serializers.ValidationError('A data final não pode ser anterior à data inicial.')

        if funcionario and inicio and fim:
            conflito = Ferias.objects.filter(
                funcionario=funcionario,
                status__in=[Ferias.Status.SOLICITADA, Ferias.Status.APROVADA],
                data_inicio__lte=fim,
                data_fim__gte=inicio,
            )
            if self.instance:
                conflito = conflito.exclude(pk=self.instance.pk)
            if conflito.exists():
                raise serializers.ValidationError('Já existe uma solicitação de férias neste período para este funcionário.')

        return attrs


class EscalaSerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.CharField(source='funcionario.nome', read_only=True)
    dia_semana_nome = serializers.CharField(source='get_dia_semana_display', read_only=True)

    class Meta:
        model = Escala
        fields = [
            'id', 'funcionario', 'funcionario_nome', 'dia_semana',
            'dia_semana_nome', 'hora_inicio', 'hora_fim',
        ]
        validators = [
            UniqueTogetherValidator(
                queryset=Escala.objects.all(),
                fields=['funcionario', 'dia_semana'],
                message='Este funcionário já tem uma escala cadastrada para este dia da semana.',
            )
        ]

    def validate(self, attrs):
        inicio = attrs.get('hora_inicio', getattr(self.instance, 'hora_inicio', None))
        fim = attrs.get('hora_fim', getattr(self.instance, 'hora_fim', None))
        if inicio and fim and fim <= inicio:
            raise serializers.ValidationError('O horário final deve ser depois do horário inicial.')
        return attrs


class DocumentoFuncionarioSerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.CharField(source='funcionario.nome', read_only=True)
    tipo_nome = serializers.CharField(source='get_tipo_display', read_only=True)
    arquivo_url = serializers.SerializerMethodField()

    class Meta:
        model = DocumentoFuncionario
        fields = [
            'id', 'funcionario', 'funcionario_nome', 'tipo', 'tipo_nome',
            'titulo', 'arquivo', 'arquivo_url', 'criado_em',
        ]
        read_only_fields = ['criado_em']
        extra_kwargs = {'arquivo': {'write_only': True}}

    def get_arquivo_url(self, obj):
        # Endereço do download protegido (exige login + permissão de RH)
        return reverse('documento-download', args=[obj.pk], request=self.context.get('request'))

    def validate_arquivo(self, arquivo):
        extensao = os.path.splitext(arquivo.name)[1].lower()
        if extensao not in EXTENSOES_PERMITIDAS:
            permitidas = ', '.join(sorted(EXTENSOES_PERMITIDAS))
            raise serializers.ValidationError(f'Tipo de arquivo não permitido. Use: {permitidas}.')
        if arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024:
            raise serializers.ValidationError(f'O arquivo deve ter no máximo {TAMANHO_MAXIMO_MB} MB.')
        return arquivo