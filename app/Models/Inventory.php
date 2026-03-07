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

        'price',
        'compare_price',

        'quantity',
        'reserved_quantity',
        'min_stock',
        'is_available',
        'status'
    ];

    protected $casts = [
        'product_id' => 'integer',
        'city_id' => 'integer',

        'price' => 'decimal:2',
        'compare_price' => 'decimal:2',

        'quantity' => 'integer',
        'reserved_quantity' => 'integer',
        'min_stock' => 'integer',
        'is_available' => 'boolean',
        'status' => 'string'
    ];

    protected $appends = [
        'encrypted_id'
    ];

     /* ------------------ Accessors ------------------ */

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString((string) $this->id);
    }

    /* ------------------ Relationships ------------------ */

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }
}