<?php

namespace App\Models;

use App\Models\Brand;
use App\Models\Review;
use App\Models\Category;
use Illuminate\Support\Str;
use App\Models\ProductImage;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'slug',
        'description',
        'price',
        'compare_price',
        'sku',
        'barcode',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_price' => 'decimal:2',
        'is_active' => 'boolean',
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
     * Relations
     */

    // Catégorie
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Marque
    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    // Images produit
    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('position');
    }

    // Avis
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    // Villes où le produit est disponible (pivot city_product)
    public function cities()
    {
        return $this->belongsToMany(City::class, 'city_products')
            ->withPivot('is_available')
            ->withTimestamps();
    }


    // Stock par ville (inventories)
    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    // Items de commande (historique ventes)
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Scopes (filtres utiles)
     */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeInBrand($query, $brandId)
    {
        return $query->where('brand_id', $brandId);
    }

    /**
     * Produits disponibles dans une ville (via pivot)
     */
    public function scopeAvailableInCity($query, $cityId)
    {
        return $query->whereHas('cities', function ($q) use ($cityId) {
            $q->where('cities.id', $cityId)
              ->where('city_product.is_available', true);
        });
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

}
