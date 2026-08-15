from django.contrib import admin
from .models import Estoque, MovimentacaoEstoque

@admin.register(Estoque)
class EstoqueAdmin(admin.ModelAdmin):
    list_display = ('produto', 'quantidade_atual', 'abaixo_do_minimo', 'atualizado_em')
    search_fields = ('produto__nome', 'produto__sku')

@admin.register(MovimentacaoEstoque)
class MovimentacaoEstoqueAdmin(admin.ModelAdmin):
    list_display = ('produto', 'tipo', 'quantidade', 'motivo', 'criado_em')
    list_filter = ('tipo', 'criado_em')
    search_fields = ('produto__nome', 'produto__sku', 'motivo')