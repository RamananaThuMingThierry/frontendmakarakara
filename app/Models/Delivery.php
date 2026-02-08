<?php

namespace App\Models;

use App\Models\User;
use App\Models\Order;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Delivery extends Model
{
    use HasFactory;

    protected $table = 'deliveries';

    protected $fillable = [
        'order_id',
        'delivery_status',
        'assigned_to',
        'scheduled_at',
        'delivered_at',
        'proof_photo_url',
        'proof_note',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'delivered_at' => 'datetime',
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
     * Relations
     */

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // livreur assigné
    public function courier()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Scopes utiles
     */

    public function scopeQueued($query)
    {
        return $query->where('delivery_status', 'queued');
    }

    public function scopeOnTheWay($query)
    {
        return $query->where('delivery_status', 'on_the_way');
    }

    public function scopeDelivered($query)
    {
        return $query->where('delivery_status', 'delivered');
    }

    /**
     * Assigner livreur
     */
    public function assignTo(User $courier)
    {
        $this->update([
            'assigned_to' => $courier->id,
            'delivery_status' => 'assigned',
        ]);
    }

    /**
     * Démarrer livraison
     */
    public function start()
    {
        $this->update([
            'delivery_status' => 'on_the_way',
        ]);
    }

    /**
     * Marquer livré
     */
    public function markDelivered($proofPhoto = null, $note = null)
    {
        $this->update([
            'delivery_status' => 'delivered',
            'delivered_at' => now(),
            'proof_photo_url' => $proofPhoto,
            'proof_note' => $note,
        ]);

        // mettre à jour commande
        $this->order->update(['status' => 'delivered']);
    }

    /**
     * Échec livraison
     */
    public function fail($note = null)
    {
        $this->update([
            'delivery_status' => 'failed',
            'proof_note' => $note,
        ]);
    }
}
