<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nouveau message de contact</title>
</head>
<body>
    <h2>Nouveau message de contact reçu</h2>

    <p><strong>Nom :</strong> {{ $contact->name }}</p>
    <p><strong>Email :</strong> {{ $contact->email }}</p>
    <p><strong>Téléphone :</strong> {{ $contact->phone ?? 'Non renseigné' }}</p>
    <p><strong>Sujet :</strong> {{ $contact->subject }}</p>
    <p><strong>Message :</strong></p>
    <p>{{ $contact->message }}</p>
</body>
</html>
