<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Builder;

class StockReservation extends Model
{
    use HasFactory;

    protected $table = 'stock_reservations';

    protected $fillable = [
        'product_id',
        'city_id',
        'quantity',
        'status',
        'reference_type',
        'reference_id',
        'created_by',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'city_id' => 'integer',
        'quantity' => 'integer',
        'created_by' => 'integer',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString((string) $this->id);
    }

    /** Relations */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Référence polymorphique (Order, etc.)
     * - Nécessite reference_type + reference_id
     */
    public function reference()
    {
        return $this->morphTo(__FUNCTION__, 'reference_type', 'reference_id');
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
    public function markReleased(): void
    {
        $this->update(['status' => 'released']);
        $this->refresh();
    }

    public function markConsumed(): void
    {
        $this->update(['status' => 'consumed']);
        $this->refresh();
    }
}