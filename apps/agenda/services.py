from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from .models import Evento, Lembrete, Notificacao


def texto_antecedencia(minutos):
    if minutos == 0:
        return 'Começa agora'
    if minutos < 60:
        return f'Começa em {minutos} minuto{"s" if minutos != 1 else ""}'
    if minutos < 1440:
        horas = minutos // 60
        return f'Começa em {horas} hora{"s" if horas != 1 else ""}'
    dias = minutos // 1440
    return f'Começa em {dias} dia{"s" if dias != 1 else ""}'


def gerar_notificacoes_pendentes(usuario):
    """Transforma em notificação os lembretes cujo horário já chegou.

    Roda quando o usuário consulta as notificações. A notificação vai para o dono
    e para todos os convidados do evento.
    """
    agora = timezone.now()

    pendentes = (
        Lembrete.objects.filter(notificado=False, evento__status=Evento.Status.AGENDADO)
        .filter(Q(evento__usuario=usuario) | Q(evento__participantes=usuario))
        .select_related('evento', 'evento__usuario')
        .distinct()
    )

    for lembrete in pendentes:
        evento = lembrete.evento
        disparo = evento.inicio - timedelta(minutes=lembrete.minutos_antes)
        if disparo > agora:
            continue

        # Marca como enviado de forma atômica: só quem conseguiu marcar cria as notificações
        marcado = Lembrete.objects.filter(pk=lembrete.pk, notificado=False).update(notificado=True)

        # Se o evento já terminou, o aviso perdeu o sentido: marca e não notifica
        if not marcado or evento.fim < agora:
            continue

        mensagem = f'{texto_antecedencia(lembrete.minutos_antes)}.'
        if evento.local:
            mensagem += f' Local: {evento.local}.'

        destinatarios = [evento.usuario, *evento.participantes.all()]
        Notificacao.objects.bulk_create(
            [
                Notificacao(
                    usuario=pessoa,
                    evento=evento,
                    titulo=f'Lembrete: {evento.titulo}',
                    mensagem=mensagem,
                )
                for pessoa in destinatarios
            ]
        )