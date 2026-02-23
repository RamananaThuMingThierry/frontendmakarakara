<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Address extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'label',
        'full_name',
        'landmark',
        'phone',
        'address_line1',
        'address_line2',
        'city_name',
        'region',
        'postal_code',
        'country',
        'latitude',
        'longitude',
        'is_default',
    ];

    protected $dates = ['deleted_at'];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'deleted_at' => 'datetime',
        'is_default' => 'boolean',
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
     * Relation utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Format adresse complète
     */
    public function getFullAddressAttribute()
    {
        return collect([
            $this->address_line1,
            $this->address_line2,
            $this->city_name,
            $this->region,
            $this->postal_code,
            $this->country,
        ])->filter()->implode(', ');
    }
}
