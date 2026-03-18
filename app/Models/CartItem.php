<?php

namespace App\Models;

use App\Models\Cart;
use App\Models\City;
use App\Models\Inventory;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class CartItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'cart_id',
        'product_id',
        'city_id',
        'inventory_id',
        'quantity',
        'unit_price',
    ];

    protected $casts = [
        'city_id' => 'integer',
        'inventory_id' => 'integer',
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
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

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }

    /**
     * Total ligne panier
     */
    public function getLineTotalAttribute()
    {
        return $this->quantity * $this->unit_price;
    }

    /**
     * Ajouter quantité
     */
    public function increase(int $qty = 1)
    {
        $this->increment('quantity', $qty);
    }

    /**
     * Réduire quantité
     */
    public function decrease(int $qty = 1)
    {
        $this->decrement('quantity', $qty);
    }
}
