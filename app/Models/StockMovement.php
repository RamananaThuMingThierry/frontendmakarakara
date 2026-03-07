<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class StockMovement extends Model
{
    use HasFactory;

    protected $table = 'stock_movements';

    protected $fillable = [
        'product_id',
        'city_from_id',
        'city_to_id',
        'type',
        'quantity',
        'stock_before',
        'stock_after',
        'reason',
        'note',
        'reference_type',
        'reference_id',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString((string) $this->id);
    }

    /**
     * Relations
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function cityFrom()
    {
        return $this->belongsTo(City::class, 'city_from_id');
    }

    public function cityTo()
    {
        return $this->belongsTo(City::class, 'city_to_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Référence polymorphique (commande, inventaire, etc.)
     */
    public function reference()
    {
        return $this->morphTo(__FUNCTION__, 'reference_type', 'reference_id');
    }

    /**
     * Scopes
     */
    public function scopeIn($query)
    {
        return $query->where('type', 'in');
    }

    public function scopeOut($query)
    {
        return $query->where('type', 'out');
    }

    public function scopeAdjust($query)
    {
        return $query->where('type', 'adjust');
    }

    public function scopeReturn($query)
    {
        return $query->where('type', 'return');
    }
}