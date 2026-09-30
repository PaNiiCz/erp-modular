from django.core.exceptions import ValidationError


def validar_cpf(valor):
    cpf = ''.join(c for c in str(valor) if c.isdigit())

    if len(cpf) != 11 or cpf == cpf[0] * 11:
        raise ValidationError('CPF inválido.')

    for i in (9, 10):
        soma = sum(int(cpf[n]) * (i + 1 - n) for n in range(i))
        digito = (soma * 10 % 11) % 10
        if digito != int(cpf[i]):
            raise ValidationError('CPF inválido.')