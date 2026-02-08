<?php

namespace App\Models;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'type',
        'value',
        'min_order_total',
        'starts_at',
        'ends_at',
        'usage_limit',
        'used_count',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'min_order_total' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'used_count' => 'integer',
        'usage_limit' => 'integer',
        'is_active' => 'boolean',
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
     * Vérifier si coupon valide
     */
    public function isValid($orderTotal): bool
    {
        if (!$this->is_active) return false;

        if ($this->starts_at && now()->lt($this->starts_at)) return false;
        if ($this->ends_at && now()->gt($this->ends_at)) return false;

        if ($this->usage_limit && $this->used_count >= $this->usage_limit)
            return false;

        if ($this->min_order_total && $orderTotal < $this->min_order_total)
            return false;

        return true;
    }

    /**
     * Calcul réduction
     */
    public function calculateDiscount($amount): float
    {
        if ($this->type === 'percent') {
            return ($amount * $this->value) / 100;
        }

        return min($this->value, $amount);
    }

    /**
     * Marquer utilisé
     */
    public function markUsed()
    {
        $this->increment('used_count');
    }

    /**
     * Scope actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function coupons()
{
    return $this->belongsToMany(Coupon::class, 'order_coupons')
        ->withPivot('discount_amount')
        ->withTimestamps();
}

}
