<?php

namespace App\Models;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class ProductImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'url',
        'position',
    ];

    protected $casts = [
        'position' => 'integer',
    ];

    protected $appends = ['encrypted_id', 'full_url'];

    /**
     * encrypted_id pour API
     */
    public function getEncryptedIdAttribute()
    {
        return Crypt::encryptString($this->id);
    }

    public function getFullUrlAttribute()
    {
        return asset($this->url);
    }

    /**
     * Relation produit
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Scope: tri par position
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('position');
    }
}
