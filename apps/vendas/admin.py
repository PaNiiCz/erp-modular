from django.contrib import admin
from .models import Venda, ItemVenda


class ItemVendaInline(admin.TabularInline):
    model = ItemVenda
    extra = 1


@admin.register(Venda)
class VendaAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'status', 'forma_pagamento', 'total', 'criado_em')
    list_filter = ('status', 'forma_pagamento')
    search_fields = ('cliente__nome',)
    inlines = [ItemVendaInline]