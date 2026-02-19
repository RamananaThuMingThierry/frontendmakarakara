<?php

namespace App\Models;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CityProduct extends Model
{
    use HasFactory;

    protected $table = 'city_products';

    protected $fillable = [
        'city_id',
        'product_id',
        'is_available',
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute()
    {
        return Crypt::encryptString($this->id);
    }

    // ✅ Relations correctes pour un pivot model
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    // ✅ Scope: disponible
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }
}
