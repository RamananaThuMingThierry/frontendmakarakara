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

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'city_products')
            ->withPivot('is_available')
            ->withTimestamps();
    }

    /**
     * Scope: disponible
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }
}
