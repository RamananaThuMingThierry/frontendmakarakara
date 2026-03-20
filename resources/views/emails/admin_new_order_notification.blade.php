<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Nouvelle commande</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
    <h2>Nouvelle commande client</h2>

    <p>Une nouvelle commande vient d'etre enregistree sur la plateforme.</p>

    <p><strong>Commande :</strong> {{ $order->order_number }}</p>
    <p><strong>Client :</strong> {{ $order->user?->name ?? '-' }}</p>
    <p><strong>Email client :</strong> {{ $order->user?->email ?? '-' }}</p>
    <p><strong>Telephone :</strong> {{ $order->address?->phone ?? '-' }}</p>
    <p><strong>Ville :</strong> {{ $order->address?->city_name ?? '-' }}</p>
    <p><strong>Adresse :</strong> {{ collect([$order->address?->address_line1, $order->address?->address_line2, $order->address?->region])->filter()->join(', ') ?: '-' }}</p>
    <p><strong>Moyen de paiement :</strong> {{ $order->paymentMethod?->name ?? $order->payment_method?->value ?? $order->payment_method ?? '-' }}</p>
    <p><strong>Statut paiement :</strong> {{ $order->payment_status?->value ?? $order->payment_status ?? '-' }}</p>
    <p><strong>Sous-total :</strong> {{ number_format((float) $order->subtotal, 0, ',', ' ') }} MGA</p>
    <p><strong>Livraison :</strong> {{ number_format((float) $order->delivery_fee, 0, ',', ' ') }} MGA</p>
    <p><strong>Total :</strong> {{ number_format((float) $order->total, 0, ',', ' ') }} MGA</p>

    @if($order->notes)
        <p><strong>Note client :</strong> {{ $order->notes }}</p>
    @endif

    <h3>Articles</h3>
    <ul>
        @foreach($order->items as $item)
            <li>
                {{ $item->product_name }} - Qté {{ (int) $item->quantity }} - {{ number_format((float) $item->line_total, 0, ',', ' ') }} MGA
            </li>
        @endforeach
    </ul>

    <p>Connectez-vous a l'administration pour traiter cette commande.</p>

    @if(!empty($platform['title']))
        <p style="margin-top: 24px;">{{ $platform['title'] }}</p>
    @endif
</body>
</html>
