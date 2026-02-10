<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PasswordResetCode extends Model
{
    use HasFactory;

    public $table = 'password_reset_codes';

    protected $fillable = ['email', 'code', 'expires_at', 'used_at'];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function getIsExpiredAttribute(): bool
    {
        return now()->greaterThan($this->expires_at);
    }

    public function getIsUsedAttribute(): bool
    {
        return !is_null($this->used_at);
    }
}
