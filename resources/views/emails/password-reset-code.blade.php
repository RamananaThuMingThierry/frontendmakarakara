<p>Bonjour,</p>

<p>Voici votre code de reinitialisation de mot de passe :</p>

<h2 style="letter-spacing: 4px;">{{ $code }}</h2>

<p>
    Ce code est valable 15 minutes, jusqu'au
    <strong>{{ \Carbon\Carbon::parse($expiresAt)->format('d/m/Y H:i') }}</strong>.
</p>

<p>Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>

<p>Cordialement,<br>L'equipe MAHAKARAKARA</p>
