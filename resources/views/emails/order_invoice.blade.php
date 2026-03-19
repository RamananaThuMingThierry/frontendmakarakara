<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Facture</title>
</head>
<body>
    <h2>Facture de commande</h2>

    <p>Bonjour {{ $order->user?->name ?? 'Client' }},</p>
    <p>Votre commande <strong>{{ $order->order_number }}</strong> a bien ete enregistree.</p>
    <p>La facture PDF est jointe a cet email. Vous pouvez la telecharger ou l imprimer a tout moment.</p>

    <p><strong>Facture :</strong> {{ $order->invoice?->number ?? '-' }}</p>
    <p><strong>Statut de paiement :</strong> {{ $order->payment_status?->value ?? $order->payment_status }}</p>
    <p><strong>Montant total :</strong> {{ number_format((float) $order->total, 2, ',', ' ') }} MGA</p>

    @if(!empty($platform['title']))
        <p><strong>Plateforme :</strong> {{ $platform['title'] }}</p>
    @endif
    @if(!empty($platform['phone']) || !empty($platform['email']))
        <p>
            <strong>Contact :</strong>
            {{ collect([$platform['phone'] ?? null, $platform['email'] ?? null])->filter()->implode(' / ') }}
        </p>
    @endif
    @if(!empty($platform['address']))
        <p><strong>Adresse :</strong> {{ $platform['address'] }}</p>
    @endif

    <h3>Articles</h3>
    <ul>
        @foreach($order->items as $item)
            <li>
                {{ $item->product_name }} x {{ $item->quantity }} -
                {{ number_format((float) $item->line_total, 2, ',', ' ') }} MGA
            </li>
        @endforeach
    </ul>

    <p>Merci pour votre commande.</p>
</body>
</html>
