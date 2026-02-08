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
