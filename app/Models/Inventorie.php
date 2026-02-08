<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Inventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'city_id',
        'quantity',
        'low_stock_threshold',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'low_stock_threshold' => 'integer',
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

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    /**
     * Scope: en rupture
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('quantity', '<=', 0);
    }

    /**
     * Scope: stock faible
     */
    public function scopeLowStock($query)
    {
        return $query->whereColumn('quantity', '<=', 'low_stock_threshold');
    }

    /**
     * Ajouter stock
     */
    public function addStock(int $amount)
    {
        $this->increment('quantity', $amount);
    }

    /**
     * Retirer stock
     */
    public function removeStock(int $amount)
    {
        $this->decrement('quantity', $amount);
    }

    /**
     * Vérifier disponibilité
     */
    public function inStock(): bool
    {
        return $this->quantity > 0;
    }
}
