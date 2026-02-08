<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'array', // JSON → array auto
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
     * Récupérer setting par clé
     */
    public static function get($key, $default = null)
    {
        $setting = static::where('key', $key)->first();

        return $setting ? $setting->value : $default;
    }

    /**
     * Mettre à jour ou créer
     */
    public static function set($key, $value)
    {
        return static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}

// Utilisation
// récupérer paramètre
// $fee = Setting::get('default_delivery_fee', 5000);

// enregistrer paramètre
// Setting::set('shop_name', 'Hair Beauty Store');

// JSON complexe
// Setting::set('payment_methods', [
//     'cod' => true,
//     'mvola' => true,
// ]);

// Exemple JSON en DB
// {
//   "key": "shop_name",
//   "value": "Hair Beauty Store"
// }


// ou

// {
//   "key": "payment_methods",
//   "value": {
//     "cod": true,
//     "mvola": true
//   }
// }