from django.contrib import admin
from .models import Cliente

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nome', 'tipo_pessoa', 'cpf_cnpj', 'email', 'telefone_principal', 'cidade', 'ativo')
    list_filter = ('tipo_pessoa', 'ativo', 'estado')
    search_fields = ('nome', 'nome_fantasia', 'cpf_cnpj', 'email')