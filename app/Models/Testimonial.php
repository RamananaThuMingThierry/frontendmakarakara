<?php

namespace App\Models;

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
        'product_used',
        'rating',
        'message',
        'position',
        'is_active',
    ];

    protected $casts = [
        'rating' => 'integer',
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

    /**
     * Scope tri position
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('position');
    }
}

// Utilisation Testimonial
// Testimonial::active()->ordered()->get();