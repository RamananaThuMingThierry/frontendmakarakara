<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'status',
        'payment_status',
        'subtotal',
        'discount_total',
        'delivery_fee',
        'total',
        'notes',
        'city_id',
        'address_id',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    protected $appends = ['encrypted_id'];

    /**
     * Générer numéro commande automatiquement
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (!$order->order_number) {
                $order->order_number = 'ORD-' . strtoupper(Str::random(8));
            }
        });
    }

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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function address()
    {
        return $this->belongsTo(Address::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function delivery()
    {
        return $this->hasOne(Delivery::class);
    }

    /**
     * Scope commandes actives
     */
    public function scopeActive($query)
    {
        return $query->whereNotIn('status', ['canceled']);
    }

    /**
     * Total calcul automatique
     */
    public function calculateTotal()
    {
        $this->total =
            $this->subtotal
            - $this->discount_total
            + $this->delivery_fee;

        $this->save();
    }

    /**
     * Marquer comme payée
     */
    public function markAsPaid()
    {
        $this->update(['payment_status' => 'paid']);
    }

    /**
     * Annuler commande
     */
    public function cancel()
    {
        $this->update(['status' => 'canceled']);
    }

    public function coupons()
{
    return $this->belongsToMany(Coupon::class, 'order_coupons')
        ->withPivot('discount_amount')
        ->withTimestamps();
}

}
