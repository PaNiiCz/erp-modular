from django.contrib import admin

from .models import Cargo, Departamento, DocumentoFuncionario, Escala, Ferias, Funcionario

admin.site.register(Departamento)
admin.site.register(Cargo)
admin.site.register(Funcionario)
admin.site.register(Ferias)
admin.site.register(Escala)
admin.site.register(DocumentoFuncionario)