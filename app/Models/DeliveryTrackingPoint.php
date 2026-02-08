<?php

namespace App\Models;

use App\Models\Delivery;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DeliveryTrackingPoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_id',
        'latitude',
        'longitude',
        'recorded_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'recorded_at' => 'datetime',
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
     * Relation livraison
     */
    public function delivery()
    {
        return $this->belongsTo(Delivery::class);
    }

    /**
     * Scope: derniers points
     */
    public function scopeLatest($query)
    {
        return $query->orderByDesc('recorded_at');
    }
}
