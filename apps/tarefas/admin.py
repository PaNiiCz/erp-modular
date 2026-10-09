from django.contrib import admin

from .models import Comentario, ItemChecklist, Projeto, Tarefa

admin.site.register(Projeto)
admin.site.register(Tarefa)
admin.site.register(ItemChecklist)
admin.site.register(Comentario)