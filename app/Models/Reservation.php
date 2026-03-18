<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'cart_id',
        'order_id',
        'status',
        'expires_at',
        'created_by',
        'reserved_at',
        'released_at',
        'consumed_at',
        'release_reason',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'cart_id' => 'integer',
        'order_id' => 'integer',
        'created_by' => 'integer',
        'expires_at' => 'datetime',
        'reserved_at' => 'datetime',
        'released_at' => 'datetime',
        'consumed_at' => 'datetime',
    ];

    protected $appends = ['encrypted_id', 'is_expired'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString((string) $this->id);
    }

    /** Relations */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->hasOneThrough(
            Product::class,
            ReservationItem::class,
            'reservation_id',
            'id',
            'id',
            'product_id'
        );
    }

    public function city()
    {
        return $this->hasOneThrough(
            City::class,
            ReservationItem::class,
            'reservation_id',
            'id',
            'id',
            'city_id'
        );
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function items()
    {
        return $this->hasMany(ReservationItem::class);
    }

    /** Scopes */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeReleased(Builder $query): Builder
    {
        return $query->where('status', 'released');
    }

    public function scopeConsumed(Builder $query): Builder
    {
        return $query->where('status', 'consumed');
    }

    /** Helpers */
    public function markReleased(?string $reason = null): void
    {
        $this->update([
            'status' => 'released',
            'released_at' => now(),
            'release_reason' => $reason,
        ]);

        $this->refresh();
    }

    public function markConsumed(?int $orderId = null): void
    {
        $this->update([
            'status' => 'consumed',
            'order_id' => $orderId ?? $this->order_id,
            'consumed_at' => now(),
            'release_reason' => null,
        ]);

        $this->refresh();
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->expires_at ? now()->greaterThanOrEqualTo($this->expires_at) : false;
    }
}
