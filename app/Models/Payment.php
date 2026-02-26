<?php

namespace App\Models;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'method',
        'provider',
        'amount',
        'status',
        'transaction_ref',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    protected $appends = ['encrypted_id'];

    /**
     * encrypted_id pour API
     */
    public function getEncryptedIdAttribute()
    {
        return Crypt::encryptString($this->id);
    }

    /**
     * Relation commande
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Scopes utiles
     */
    public function scopeSuccess($query)
    {
        return $query->where('status', 'success');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Marquer paiement réussi
     */
    public function markSuccess($transactionRef = null)
    {
        $this->update([
            'status' => 'success',
            'transaction_ref' => $transactionRef,
            'paid_at' => now(),
        ]);

        // mettre à jour la commande
        $this->order->markAsPaid();
    }

    /**
     * Marquer paiement échoué
     */
    public function markFailed()
    {
        $this->update(['status' => 'failed']);
    }

    /**
     * Remboursement
     */
    public function refund()
    {
        $this->update(['status' => 'refunded']);
    }
}

/*

✅ 1️⃣ Cas 1 : Paiement Mobile Money réussi

Commande #10 payée par Mvola.

Payment::create([
    'order_id' => 10,
    'payment_method_id' => 2, // Mvola
    'amount' => 62000.00,
    'status' => 'success',
    'transaction_ref' => 'MVL-8839201XX',
    'meta' => json_encode([
        'provider' => 'mvola',
        'phone' => '0341234567',
        'raw_status' => '00',
    ]),
    'paid_at' => now(),
]);

❌ 2️⃣ Cas 2 : Paiement échoué puis nouvelle tentative

Commande #11 – première tentative échoue.

Payment::create([
    'order_id' => 11,
    'payment_method_id' => 3, // Orange Money
    'amount' => 45000.00,
    'status' => 'failed',
    'transaction_ref' => 'ORG-99112233',
    'meta' => json_encode([
        'reason' => 'Insufficient balance'
    ]),
]);

Puis deuxième tentative réussie :

Payment::create([
    'order_id' => 11,
    'payment_method_id' => 3,
    'amount' => 45000.00,
    'status' => 'success',
    'transaction_ref' => 'ORG-99112234',
    'paid_at' => now(),
]);

📌 Tu peux donc avoir plusieurs paiements pour une même commande
(ce qui est très important en vrai e-commerce).

💵 3️⃣ Cas 3 : Paiement à la livraison (Cash)

Commande #12 – paiement en cash.

Au moment de la livraison :

Payment::create([
    'order_id' => 12,
    'payment_method_id' => 1, // Cash
    'amount' => 30000.00,
    'status' => 'success',
    'transaction_ref' => null,
    'paid_at' => now(),
]);

📌 Ici :

Pas de transaction_ref

Pas de meta

Juste confirmation manuelle

🔄 4️⃣ Cas 4 : Remboursement

Si la commande #10 est remboursée :

Payment::create([
    'order_id' => 10,
    'payment_method_id' => 2,
    'amount' => 62000.00,
    'status' => 'refunded',
    'transaction_ref' => 'REF-MVL-8839201XX',
    'meta' => json_encode([
        'refund_reason' => 'Customer cancellation'
    ]),
]);

*/