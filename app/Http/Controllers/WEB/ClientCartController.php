<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ClientCartController extends Controller
{
    public function show(Request $request)
    {
        $cart = $this->getOrCreateCart($request);

        return response()->json([
            'message' => 'Panier charge avec succes.',
            'data' => $this->formatCart($cart),
        ]);
    }

    public function sync(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'items.*.inventory_id' => ['nullable', 'integer', 'exists:inventories,id'],
        ]);

        $cart = DB::transaction(function () use ($request, $validated) {
            $cart = $this->getOrCreateCart($request);
            $payload = collect($validated['items']);
            $products = Product::query()
                ->whereIn('id', $payload->pluck('product_id')->all())
                ->get(['id', 'price'])
                ->keyBy('id');
            $inventoryIds = $payload->pluck('inventory_id')->filter()->all();
            $inventories = Inventory::query()
                ->whereIn('id', $inventoryIds)
                ->get(['id', 'product_id', 'city_id'])
                ->keyBy('id');

            foreach ($payload as $item) {
                $product = $products->get((int) $item['product_id']);
                if (! $product) {
                    continue;
                }

                $inventory = null;
                if (! empty($item['inventory_id'])) {
                    $inventory = $inventories->get((int) $item['inventory_id']);
                    if (! $inventory || (int) $inventory->product_id !== (int) $product->id) {
                        throw ValidationException::withMessages([
                            'items' => ['Un inventaire du panier est invalide.'],
                        ]);
                    }
                }

                $cityId = isset($item['city_id']) ? (int) $item['city_id'] : ($inventory?->city_id ? (int) $inventory->city_id : null);

                $cartItem = $cart->items()->firstOrNew([
                    'product_id' => (int) $item['product_id'],
                ]);

                $currentQty = $cartItem->exists ? (int) $cartItem->quantity : 0;

                $cartItem->fill([
                    'quantity' => $currentQty + (int) $item['quantity'],
                    'unit_price' => (float) $product->price,
                    'city_id' => $cityId,
                    'inventory_id' => $inventory?->id,
                ]);
                $cartItem->save();
            }

            return $cart->fresh(['items.product.images', 'items.city', 'items.inventory']);
        });

        return response()->json([
            'message' => 'Panier synchronise avec succes.',
            'data' => $this->formatCart($cart),
        ]);
    }

    public function upsertItem(Request $request, Product $product)
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:0'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'inventory_id' => ['nullable', 'integer', 'exists:inventories,id'],
        ]);

        $cart = DB::transaction(function () use ($request, $product, $validated) {
            $cart = $this->getOrCreateCart($request);
            $quantity = (int) $validated['quantity'];
            $inventory = null;

            if (! empty($validated['inventory_id'])) {
                $inventory = Inventory::query()
                    ->whereKey((int) $validated['inventory_id'])
                    ->first(['id', 'product_id', 'city_id']);

                if (! $inventory || (int) $inventory->product_id !== (int) $product->id) {
                    throw ValidationException::withMessages([
                        'inventory_id' => ['Inventaire invalide pour ce produit.'],
                    ]);
                }
            }

            $cityId = isset($validated['city_id'])
                ? (int) $validated['city_id']
                : ($inventory?->city_id ? (int) $inventory->city_id : null);
            $existing = $cart->items()->where('product_id', $product->id)->first();

            if ($quantity <= 0) {
                if ($existing) {
                    $existing->delete();
                }

                return $cart->fresh(['items.product.images', 'items.city', 'items.inventory']);
            }

            $item = $existing ?? $cart->items()->make([
                'product_id' => $product->id,
            ]);

            $item->fill([
                'quantity' => $quantity,
                'unit_price' => (float) $product->price,
                'city_id' => $cityId ?? $item->city_id,
                'inventory_id' => $inventory?->id ?? $item->inventory_id,
            ]);
            $item->save();

            return $cart->fresh(['items.product.images', 'items.city', 'items.inventory']);
        });

        return response()->json([
            'message' => 'Panier mis a jour avec succes.',
            'data' => $this->formatCart($cart),
        ]);
    }

    public function removeItem(Request $request, Product $product)
    {
        $cart = DB::transaction(function () use ($request, $product) {
            $cart = $this->getOrCreateCart($request);
            $cart->items()->where('product_id', $product->id)->delete();

            return $cart->fresh(['items.product.images', 'items.city', 'items.inventory']);
        });

        return response()->json([
            'message' => 'Produit retire du panier.',
            'data' => $this->formatCart($cart),
        ]);
    }

    public function clear(Request $request)
    {
        $cart = DB::transaction(function () use ($request) {
            $cart = $this->getOrCreateCart($request);
            $this->releaseActiveCartReservations($cart->id, $request->user()->id);
            $cart->items()->delete();

            return $cart->fresh(['items.product.images', 'items.city', 'items.inventory']);
        });

        return response()->json([
            'message' => 'Panier vide avec succes.',
            'data' => $this->formatCart($cart),
        ]);
    }

    private function getOrCreateCart(Request $request): Cart
    {
        return Cart::query()->firstOrCreate(
            ['user_id' => $request->user()->id],
            ['status' => 'active']
        )->load(['items.product.images', 'items.city', 'items.inventory']);
    }

    private function formatCart(Cart $cart): array
    {
        $cart->loadMissing(['items.product.images']);

        $items = $cart->items->map(function ($item) {
            $product = $item->product;
            $image = $product?->images->first()?->url;

            return [
                'id' => $product?->id,
                'product_id' => $product?->id,
                'cart_item_id' => $item->id,
                'inventory_id' => $item->inventory_id,
                'city_id' => $item->city_id,
                'city_name' => $item->city?->name,
                'name' => $product?->name,
                'price' => (float) $item->unit_price,
                'qty' => (int) $item->quantity,
                'image' => $image ? asset($image) : null,
            ];
        })->filter(fn ($item) => ! is_null($item['product_id']))->values();

        return [
            'id' => $cart->id,
            'status' => $cart->status,
            'cart_count' => $items->sum('qty'),
            'total' => $items->sum(fn ($item) => $item['price'] * $item['qty']),
            'items' => $items->all(),
        ];
    }

    private function releaseActiveCartReservations(int $cartId, int $userId): void
    {
        $reservations = Reservation::query()
            ->with('items')
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->where('cart_id', $cartId)
            ->lockForUpdate()
            ->get();

        foreach ($reservations as $reservation) {
            foreach ($reservation->items as $reservationItem) {
                $inventory = Inventory::query()
                    ->where('product_id', $reservationItem->product_id)
                    ->where('city_id', $reservationItem->city_id)
                    ->lockForUpdate()
                    ->first();

                if ($inventory) {
                    $inventory->update([
                        'reserved_quantity' => max(0, (int) $inventory->reserved_quantity - (int) $reservationItem->quantity),
                    ]);
                }
            }

            $reservation->markReleased('cart_cleared');
        }
    }
}
