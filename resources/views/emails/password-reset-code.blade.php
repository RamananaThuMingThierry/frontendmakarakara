<p>Bonjour,</p>

<p>Voici votre code de réinitialisation :</p>

<h2 style="letter-spacing: 4px;">{{ $code }}</h2>

<p>Ce code expire à : <strong>{{ \Carbon\Carbon::parse($expiresAt)->format('d/m/Y H:i') }}</strong></p>

<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>

<p>Cordialement,<br>L'équipe MAHAKARAKARA</p>