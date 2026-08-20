from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Venda, ItemVenda


class ItemVendaSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ItemVenda
        fields = ['id', 'produto', 'produto_nome', 'quantidade', 'preco_unitario', 'subtotal']


class VendaSerializer(serializers.ModelSerializer):
    itens = ItemVendaSerializer(many=True)
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Venda
        fields = ['id', 'cliente', 'cliente_nome', 'status', 'forma_pagamento', 'desconto',
                  'observacoes', 'itens', 'total', 'criado_em', 'atualizado_em']

    def create(self, validated_data):
        itens_data = validated_data.pop('itens')
        status_desejado = validated_data.pop('status', 'ABERTA')

        try:
            venda = Venda.objects.create(status='ABERTA', **validated_data)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else e.messages)

        for item_data in itens_data:
            ItemVenda.objects.create(venda=venda, **item_data)

        if status_desejado != 'ABERTA':
            venda.status = status_desejado
            try:
                venda.save()
            except DjangoValidationError as e:
                raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else e.messages)

        return venda

    def update(self, instance, validated_data):
        itens_data = validated_data.pop('itens', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        try:
            instance.save()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else e.messages)

        if itens_data is not None:
            instance.itens.all().delete()
            for item_data in itens_data:
                ItemVenda.objects.create(venda=instance, **item_data)

        return instance