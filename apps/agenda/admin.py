from django.contrib import admin

from .models import Evento, Lembrete, Notificacao

admin.site.register(Evento)
admin.site.register(Lembrete)
admin.site.register(Notificacao)