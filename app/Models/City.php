<?php

namespace App\Models;

use App\Models\Product;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class City extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'region',
        'is_active',
    ];

    protected $casts = [
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
     * Produits disponibles dans cette ville
     * (pivot: city_product)
     */
    public function products()
    {
        return $this->belongsToMany(Product::class, 'city_product')
            ->withPivot('is_available')
            ->withTimestamps();
    }

    /**
     * Stock par ville
     */
    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    /**
     * Commandes liées à cette ville
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Scope villes actives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

}
