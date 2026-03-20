<?php

namespace App\Models;

use App\Models\Product;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Testimonial extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'photo_url',
        'city',
        'target_type',
        'product_id',
        'product_used',
        'rating',
        'message',
        'is_active',
    ];

    protected $casts = [
        'rating' => 'integer',
        'product_id' => 'integer',
        'position' => 'integer',
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
     * Scope actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
