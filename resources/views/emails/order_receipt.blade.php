<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Recu de paiement</title>
</head>
<body>
    <h2>Recu de paiement</h2>

    <p>Bonjour {{ $order->user?->name ?? 'Client' }},</p>
    <p>Votre paiement a ete valide pour la commande <strong>{{ $order->order_number }}</strong>.</p>
    <p>Le recu PDF est joint a cet email. Vous pouvez le telecharger, l imprimer et le conserver comme preuve de paiement.</p>

    <p><strong>Recu :</strong> {{ $order->receipt?->number ?? '-' }}</p>
    <p><strong>Facture :</strong> {{ $order->invoice?->number ?? '-' }}</p>
    <p><strong>Moyen de paiement :</strong> {{ $order->payment_method?->value ?? $order->payment_method }}</p>
    <p><strong>Montant total :</strong> {{ number_format((float) $order->total, 2, ',', ' ') }} MGA</p>
    <p><strong>Date de paiement :</strong> {{ optional($order->receipt?->paid_at)->format('d/m/Y H:i') ?? '-' }}</p>

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
