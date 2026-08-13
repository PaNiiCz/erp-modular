from django.contrib.auth.tokens import PasswordResetTokenGenerator


class TokenConfirmacaoEmail(PasswordResetTokenGenerator):
    def _make_hash_value(self, usuario, timestamp):
        return f"{usuario.pk}{timestamp}{usuario.email_confirmado}"


gerador_token_email = TokenConfirmacaoEmail()