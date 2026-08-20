from django.contrib import admin
from .models import CategoriaFinanceira, LancamentoFinanceiro


@admin.register(CategoriaFinanceira)
class CategoriaFinanceiraAdmin(admin.ModelAdmin):
    list_display = ('nome', 'tipo')
    list_filter = ('tipo',)


@admin.register(LancamentoFinanceiro)
class LancamentoFinanceiroAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'tipo', 'valor', 'status', 'data_vencimento', 'cliente')
    list_filter = ('tipo', 'status', 'forma_pagamento')
    search_fields = ('descricao', 'cliente__nome')