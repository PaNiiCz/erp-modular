import ipaddress

from .models import RegistroAtividade


def _ip_da_requisicao(request):
    if request is None:
        return None
    encaminhado = request.META.get('HTTP_X_FORWARDED_FOR')
    bruto = encaminhado.split(',')[0].strip() if encaminhado else request.META.get('REMOTE_ADDR')
    try:
        return str(ipaddress.ip_address(bruto))
    except (ValueError, TypeError):
        return None


def registrar(usuario, acao, descricao, alvo=None, request=None):
    """
    Grava um registro de auditoria.
    Pode ser chamada por qualquer módulo:
        from apps.administracao.services import registrar
        registrar(request.user, 'VENDA_CONFIRMADA', 'Confirmou a venda #12', alvo=venda, request=request)
    """
    ator = usuario if (usuario is not None and getattr(usuario, 'is_authenticated', False)) else None
    nome_ator = (ator.get_full_name() or ator.get_username()) if ator else 'Sistema'

    return RegistroAtividade.objects.create(
        usuario=ator,
        usuario_nome=nome_ator[:150],
        acao=str(acao)[:40],
        descricao=str(descricao)[:255],
        alvo_tipo=alvo.__class__.__name__ if alvo is not None else '',
        alvo_id=str(alvo.pk) if alvo is not None else '',
        alvo_nome=str(alvo)[:150] if alvo is not None else '',
        ip=_ip_da_requisicao(request),
    )