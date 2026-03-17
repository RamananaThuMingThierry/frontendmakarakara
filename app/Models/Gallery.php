<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Gallery extends Model
{
    use HasFactory;

    protected $fillable = [
        'image_url',
        'name',
        'likes',
    ];

    protected $casts = [
        'likes' => 'integer',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString((string) $this->id);
    }

    public function likedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'gallery_likes')
            ->withTimestamps();
    }
}
