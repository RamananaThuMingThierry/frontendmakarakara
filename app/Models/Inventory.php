<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Builder;

class Inventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'city_id',

        'price',
        'compare_price',

        'quantity',
        'reserved_quantity',
        'min_stock',
        'is_available',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'city_id' => 'integer',

        'price' => 'decimal:2',
        'compare_price' => 'decimal:2',

        'quantity' => 'integer',
        'reserved_quantity' => 'integer',
        'min_stock' => 'integer',
        'is_available' => 'boolean',
    ];

    protected $appends = [
        'encrypted_id',
        'available_quantity',
        'total_quantity',
        'is_low_stock',
        'effective_price',
    ];

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

    /** Accessors utiles pour ton UI */
    public function getAvailableQuantityAttribute(): int
    {
        return (int) $this->quantity;
    }

    public function getTotalQuantityAttribute(): int
    {
        return (int) $this->quantity + (int) $this->reserved_quantity;
    }

    public function getIsLowStockAttribute(): bool
    {
        if ($this->min_stock === null) return false;
        return $this->quantity <= $this->min_stock;
    }

    /**
     * Prix effectif (fallback product.price si price ville null)
     * -> pratique pour ton affichage "Prix: ..."
     */
    public function getEffectivePriceAttribute(): ?string
    {
        $local = $this->price;
        if ($local !== null) return (string) $local;

        // évite N+1 : charge product si pas déjà chargé
        $product = $this->relationLoaded('product') ? $this->product : $this->product()->first();
        return $product?->price !== null ? (string) $product->price : null;
    }

    /** Scopes */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_available', true);
    }

    public function scopeOutOfStock(Builder $query): Builder
    {
        return $query->where('quantity', '<=', 0);
    }

    public function scopeLowStock(Builder $query): Builder
    {
        return $query
            ->whereNotNull('min_stock')
            ->whereColumn('quantity', '<=', 'min_stock');
    }

    /** Méthodes stock (sans mouvement) : à utiliser via service idéalement */
    public function addStock(int $amount): void
    {
        if ($amount <= 0) return;
        $this->increment('quantity', $amount);
        $this->refresh();
    }

    public function removeStock(int $amount): void
    {
        if ($amount <= 0) return;

        // Ici je bloque si insuffisant (recommandé)
        if ($this->quantity < $amount) {
            throw new \RuntimeException('Stock insuffisant.');
        }

        $this->decrement('quantity', $amount);
        $this->refresh();
    }

    public function reserve(int $amount): void
    {
        if ($amount <= 0) return;
        if ($this->quantity < $amount) {
            throw new \RuntimeException('Stock disponible insuffisant pour réserver.');
        }

        // déplacer du disponible -> réservé
        $this->update([
            'quantity' => $this->quantity - $amount,
            'reserved_quantity' => $this->reserved_quantity + $amount,
        ]);
        $this->refresh();
    }

    public function releaseReservation(int $amount): void
    {
        if ($amount <= 0) return;
        if ($this->reserved_quantity < $amount) {
            throw new \RuntimeException('Réservé insuffisant.');
        }

        // réservé -> disponible
        $this->update([
            'quantity' => $this->quantity + $amount,
            'reserved_quantity' => $this->reserved_quantity - $amount,
        ]);
        $this->refresh();
    }

    public function inStock(): bool
    {
        return $this->quantity > 0;
    }
}