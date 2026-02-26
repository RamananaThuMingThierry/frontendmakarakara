<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class PaymentMethod extends Model
{
    use HasFactory;

    public $table = 'payment_methods';

    protected $fillable = [
        'name',
        'code',
        'image',
        'is_active'
    ];

    protected $appends = ['encrypted_id'];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    /**
     * encrypted_id pour API
     */
    public function getEncryptedIdAttribute()
    {
        return Crypt::encryptString($this->id);
    }    


}
