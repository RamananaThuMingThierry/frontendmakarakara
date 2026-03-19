<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture {{ $order->invoice?->number ?? $order->order_number }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #111827;
            font-size: 12px;
            line-height: 1.5;
        }
        .header {
            width: 100%;
            border-bottom: 2px solid #111827;
            padding-bottom: 14px;
            margin-bottom: 20px;
        }
        .header-table {
            width: 100%;
        }
        .header-table td {
            vertical-align: top;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 4px 0;
        }
        .muted {
            color: #6b7280;
        }
        .logo {
            max-width: 120px;
            max-height: 80px;
        }
        .grid {
            width: 100%;
            margin-bottom: 18px;
        }
        .grid td {
            vertical-align: top;
            width: 50%;
            padding-right: 12px;
        }
        .card {
            border: 1px solid #d1d5db;
            padding: 12px;
        }
        .label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table.items th,
        table.items td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
        }
        table.items th {
            background: #f3f4f6;
        }
        .totals {
            margin-top: 16px;
            width: 100%;
        }
        .totals td {
            padding: 4px 0;
        }
        .value {
            text-align: right;
        }
        .total-final {
            font-size: 16px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td>
                    <div class="title">Facture</div>
                    <div class="muted">Commande {{ $order->order_number }}</div>
                    <div class="muted">Facture {{ $order->invoice?->number ?? '-' }}</div>
                    <div class="muted">Date emission: {{ optional($order->invoice?->issued_at)->format('d/m/Y H:i') ?? '-' }}</div>
                </td>
                <td style="text-align:right;">
                    @if($logoPath)
                        <img src="{{ $logoPath }}" alt="Logo plateforme" class="logo">
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <table class="grid">
        <tr>
            <td>
                <div class="card">
                    <div class="label">Emetteur</div>
                    <div><strong>{{ $platform['title'] ?? 'Plateforme' }}</strong></div>
                    @if(!empty($platform['description']))
                        <div>{{ $platform['description'] }}</div>
                    @endif
                    <div>{{ $platform['address'] ?? '-' }}</div>
                    <div>{{ $platform['phone'] ?? '-' }}</div>
                    <div>{{ $platform['email'] ?? '-' }}</div>
                </div>
            </td>
            <td>
                <div class="card">
                    <div class="label">Client</div>
                    <div><strong>{{ $order->address?->full_name ?? $order->user?->name ?? 'Client' }}</strong></div>
                    <div>{{ $order->user?->email ?? '-' }}</div>
                    <div>{{ $order->address?->phone ?? '-' }}</div>
                    <div>
                        {{ collect([$order->address?->address_line1, $order->address?->address_line2, $order->address?->city_name, $order->address?->region])->filter()->implode(', ') ?: '-' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="card">
        <div class="label">Informations de paiement</div>
        <div><strong>Methode:</strong> {{ $order->payment_method?->value ?? $order->payment_method }}</div>
        <div><strong>Statut paiement:</strong> {{ $order->payment_status?->value ?? $order->payment_status }}</div>
        <div><strong>Statut facture:</strong> {{ $order->invoice?->status?->value ?? $order->invoice?->status ?? '-' }}</div>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>Produit</th>
                <th>SKU</th>
                <th>Quantite</th>
                <th>Prix unitaire</th>
                <th>Total ligne</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
                <tr>
                    <td>{{ $item->product_name }}</td>
                    <td>{{ $item->sku ?: '-' }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ number_format((float) $item->unit_price, 2, ',', ' ') }} MGA</td>
                    <td>{{ number_format((float) $item->line_total, 2, ',', ' ') }} MGA</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td>Sous-total</td>
            <td class="value">{{ number_format((float) $order->subtotal, 2, ',', ' ') }} MGA</td>
        </tr>
        <tr>
            <td>Remise</td>
            <td class="value">{{ number_format((float) $order->discount_total, 2, ',', ' ') }} MGA</td>
        </tr>
        <tr>
            <td>Livraison</td>
            <td class="value">{{ number_format((float) $order->delivery_fee, 2, ',', ' ') }} MGA</td>
        </tr>
        <tr>
            <td class="total-final">Total</td>
            <td class="value total-final">{{ number_format((float) $order->total, 2, ',', ' ') }} MGA</td>
        </tr>
    </table>
</body>
</html>
