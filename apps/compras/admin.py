from django.contrib import admin
from .models import Compra, ItemCompra


class ItemCompraInline(admin.TabularInline):
    model = ItemCompra
    extra = 1


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = ('id', 'fornecedor', 'status', 'forma_pagamento', 'total', 'criado_em')
    list_filter = ('status', 'forma_pagamento')
    search_fields = ('fornecedor__nome',)
    inlines = [ItemCompraInline]