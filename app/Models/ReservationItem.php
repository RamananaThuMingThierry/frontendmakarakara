<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReservationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'product_id',
        'city_id',
        'quantity',
    ];

    protected $casts = [
        'reservation_id' => 'integer',
        'product_id' => 'integer',
        'city_id' => 'integer',
        'quantity' => 'integer',
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }
}
