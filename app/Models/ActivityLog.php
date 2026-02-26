<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ActivityLog extends Model
{
    use HasFactory;

    /** Status 
     * 
     * Action / Status API	Code HTTP	color
     * Création réussie	201	success
     * OK (GET)	200	info
     * Mise à jour	200 / 204	primary
     * Suppression	200 / 204	danger
     * Bad Request  400 warning
     * Not found	404	warning
     * Validation error	422	warning
     * Unauthorized	401	danger
     * Forbidden	403	danger
     * Server error	500	danger
     * 
     * **/
     
    protected $fillable = [
        'user_id', 
        'action', 
        'color',
        'entity_type', 
        'entity_id', 
        'method',
        'url',
        'route',
        'status_code',
        'message',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array',
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
}

// Utilisation
// log action admin
// ActivityLog::log('created_product', $product, [
//     'name' => $product->name
// ]);

// log manuel
// ActivityLog::create([
//     'user_id' => auth()->id(),
//     'action' => 'updated_stock',
//     'entity_type' => 'Product',
//     'entity_id' => 5,
// ]);

// récupérer logs produit
// ActivityLog::forEntity('Product', 5)->get();

// Exemple JSON
// {
//   "action": "updated_stock",
//   "entity_type": "Product",
//   "entity_id": 5,
//   "metadata": {
//     "old": 10,
//     "new": 5
//   },
//   "encrypted_id": "..."
// }
