from django.contrib import admin
from .models import Categoria, Marca, Fornecedor, Produto

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nome',)
    search_fields = ('nome',)

@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    list_display = ('nome',)
    search_fields = ('nome',)

@admin.register(Fornecedor)
class FornecedorAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cnpj', 'telefone', 'email')
    search_fields = ('nome', 'cnpj')

@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ('sku', 'nome', 'categoria', 'marca', 'preco_venda', 'estoque_minimo', 'status')
    list_filter = ('status', 'categoria', 'marca', 'unidade')
    search_fields = ('sku', 'nome', 'codigo_barras')