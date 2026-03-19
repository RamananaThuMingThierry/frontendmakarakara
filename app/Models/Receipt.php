<?php

namespace App\Models;

use App\Enums\PaymentMethodCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Receipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'number',
        'paid_at',
        'sent_at',
        'payment_method',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'sent_at' => 'datetime',
        'payment_method' => PaymentMethodCode::class,
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
