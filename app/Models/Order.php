<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethodCode;
use App\Enums\PaymentStatus;
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
        'coupon_code',
        'payment_method',
        'payment_method_id',
        'payment_reference',
        'total',
        'notes',
        'city_id',
        'address_id',
    ];

    protected $casts = [
        'status' => OrderStatus::class,
        'payment_status' => PaymentStatus::class,
        'payment_method' => PaymentMethodCode::class,
        'subtotal' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'total' => 'decimal:2',
        'payment_method_id' => 'integer',
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

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function receipt()
    {
        return $this->hasOne(Receipt::class);
    }

    public function delivery()
    {
        return $this->hasOne(Delivery::class);
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    /**
     * Scope commandes actives
     */
    public function scopeActive($query)
    {
        return $query->whereNotIn('status', [OrderStatus::CANCELLED->value]);
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
        $this->update(['payment_status' => PaymentStatus::PAID]);
    }

    /**
     * Annuler commande
     */
    public function cancel()
    {
        $this->update(['status' => OrderStatus::CANCELLED]);
    }

    public function coupons()
{
    return $this->belongsToMany(Coupon::class, 'order_coupons')
        ->withPivot('discount_amount')
        ->withTimestamps();
}

}
