<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class InventoryPriceHistory extends Model
{
    use HasFactory;

    protected $table = 'inventory_price_histories';

    protected $fillable = [
        'product_id',
        'city_id',
        'old_price',
        'new_price',
        'changed_by',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'city_id' => 'integer',
        'old_price' => 'decimal:2',
        'new_price' => 'decimal:2',
        'changed_by' => 'integer',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString((string) $this->id);
    }

    /** Relations */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}