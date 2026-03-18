<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Inventory;
use App\Models\StockReservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ClientReservationController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();

        $payload = DB::transaction(function () use ($user) {
            $this->releaseExpiredReservations($user->id);

            $cart = Cart::query()
                ->where('user_id', $user->id)
                ->with(['items.product', 'items.city'])
                ->first();

            if (! $cart || $cart->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => ['Votre panier est vide.'],
                ]);
            }

            $this->releaseActiveCartReservations($cart->id, $user->id);

            $expiresAt = now()->addHours(24);
            $reservations = [];

            foreach ($cart->items as $item) {
                if (! $item->city_id) {
                    throw ValidationException::withMessages([
                        'cart' => ["Le produit {$item->product?->name} n'a pas de ville associee pour la reservation."],
                    ]);
                }

                $inventory = Inventory::query()
                    ->where('product_id', $item->product_id)
                    ->where('city_id', $item->city_id)
                    ->lockForUpdate()
                    ->first();

                if (! $inventory || ! $inventory->is_available) {
                    throw ValidationException::withMessages([
                        'cart' => ["Le produit {$item->product?->name} n'est pas reservable dans cette ville."],
                    ]);
                }

                $available = (int) $inventory->quantity - (int) $inventory->reserved_quantity;
                if ($available < (int) $item->quantity) {
                    throw ValidationException::withMessages([
                        'cart' => ["Stock insuffisant pour reserver {$item->product?->name}."],
                    ]);
                }

                $inventory->increment('reserved_quantity', (int) $item->quantity);

                $reservation = StockReservation::create([
                    'product_id' => $item->product_id,
                    'city_id' => $item->city_id,
                    'quantity' => (int) $item->quantity,
                    'status' => 'active',
                    'expires_at' => $expiresAt,
                    'reference_type' => Cart::class,
                    'reference_id' => $cart->id,
                    'created_by' => $user->id,
                ]);

                $reservations[] = [
                    'id' => $reservation->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product?->name,
                    'city_id' => $item->city_id,
                    'city_name' => $item->city?->name,
                    'quantity' => (int) $item->quantity,
                    'expires_at' => $reservation->expires_at?->toISOString(),
                ];
            }

            return [
                'cart_id' => $cart->id,
                'expires_at' => $expiresAt->toISOString(),
                'reservations' => $reservations,
            ];
        });

        return response()->json([
            'message' => 'Reservation creee avec succes. Elle expire dans 24 heures si aucune commande n est pas passee.',
            'data' => $payload,
        ], 201);
    }

    private function releaseExpiredReservations(int $userId): void
    {
        $reservations = StockReservation::query()
            ->where('created_by', $userId)
            ->where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->lockForUpdate()
            ->get();

        foreach ($reservations as $reservation) {
            $inventory = Inventory::query()
                ->where('product_id', $reservation->product_id)
                ->where('city_id', $reservation->city_id)
                ->lockForUpdate()
                ->first();

            if ($inventory) {
                $inventory->update([
                    'reserved_quantity' => max(0, (int) $inventory->reserved_quantity - (int) $reservation->quantity),
                ]);
            }

            $reservation->update(['status' => 'released']);
        }
    }

    private function releaseActiveCartReservations(int $cartId, int $userId): void
    {
        $reservations = StockReservation::query()
            ->where('created_by', $userId)
            ->where('status', 'active')
            ->where('reference_type', Cart::class)
            ->where('reference_id', $cartId)
            ->lockForUpdate()
            ->get();

        foreach ($reservations as $reservation) {
            $inventory = Inventory::query()
                ->where('product_id', $reservation->product_id)
                ->where('city_id', $reservation->city_id)
                ->lockForUpdate()
                ->first();

            if ($inventory) {
                $inventory->update([
                    'reserved_quantity' => max(0, (int) $inventory->reserved_quantity - (int) $reservation->quantity),
                ]);
            }

            $reservation->update(['status' => 'released']);
        }
    }
}
