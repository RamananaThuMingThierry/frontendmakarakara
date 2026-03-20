<?php

namespace App\Http\Controllers\WEB\CUSTOMER;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Inventory;
use App\Models\Reservation;
use App\Models\ReservationItem;
use App\Services\ActivityLogService;
use App\Services\AdminNotificationService;
use App\Services\ReservationItemService;
use App\Services\ReservationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class ReservationController extends Controller
{
    public function __construct(
        private readonly ReservationService $reservationService,
        private readonly ReservationItemService $reservationItemService,
        private readonly ActivityLogService $activityLogService,
        private readonly AdminNotificationService $adminNotificationService,
    ) {}

    public function index()
    {
        try {
            $user = Auth::user();

            DB::transaction(function () use ($user) {
                $this->releaseExpiredReservations($user->id);
            });

            $reservations = $this->reservationService->getAllReservations(
                keys: 'user_id',
                values: $user->id,
                relations: ['items.product:id,name', 'items.city:id,name']
            )
                ->sortByDesc('created_at')
                ->map(fn (Reservation $reservation) => $this->formatCustomerReservationSummary($reservation))
                ->values();

            return response()->json([
                'data' => $reservations,
            ]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'index_reservation_failed',
                'entity_type' => 'Reservation',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'customer.reservations.index',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des reservations client.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des reservations.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $user = $request->user();

        try {
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

                $expiresAt = now()->addHours(24);

                $reservation = $this->reservationService->createReservation([
                    'user_id' => $user->id,
                    'cart_id' => $cart->id,
                    'status' => 'active',
                    'expires_at' => $expiresAt,
                    'created_by' => $user->id,
                    'reserved_at' => now(),
                ]);

                $reservationItems = [];

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

                    $reservationItem = $this->reservationItemService->createReservationItem([
                        'reservation_id' => $reservation->id,
                        'product_id' => $item->product_id,
                        'city_id' => $item->city_id,
                        'quantity' => (int) $item->quantity,
                    ]);

                    $reservationItem->loadMissing(['product:id,name', 'city:id,name']);
                    $reservationItems[] = $reservationItem;
                }

                $cart->items()->delete();
                $reservation->setRelation('items', collect($reservationItems));

                return [
                    'cart_id' => $cart->id,
                    'expires_at' => $expiresAt->toISOString(),
                    'reservation_id' => $reservation->id,
                    'reservation' => $this->formatCustomerReservation($reservation),
                    'cart_cleared' => true,
                ];
            });

            $reservation = Reservation::query()
                ->with(['user', 'items.product', 'items.city'])
                ->find($payload['reservation_id']);

            if ($reservation) {
                $this->adminNotificationService->notifyNewReservation($reservation);
            }

            return response()->json([
                'message' => 'Reservation creee avec succes. Elle expire dans 24 heures si aucune commande n est pas passee.',
                'data' => $payload,
            ], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_reservation_failed',
                'entity_type' => 'Reservation',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'POST',
                'route' => 'customer.reservations.store',
                'status_code' => 500,
                'message' => 'Erreur lors de la creation de la reservation.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Impossible de creer la reservation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(string $reservationId)
    {
        $id = $this->resolveReservationId($reservationId);

        if (is_null($id)) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'show_reservation_failed',
                'entity_type' => 'Reservation',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'customer.reservations.show',
                'status_code' => 400,
                'message' => 'ID de reservation invalide.',
                'metadata' => [
                    'reservation_id' => $reservationId,
                ],
            ]);

            return response()->json([
                'message' => 'ID de reservation invalide.',
            ], 400);
        }

        try {
            $reservation = $this->reservationService->getReservationById(
                $id,
                relations: ['items.product:id,name', 'items.city:id,name']
            );

            if (! $reservation || (int) $reservation->user_id !== (int) Auth::id()) {
                return response()->json([
                    'message' => 'Reservation introuvable.',
                ], 404);
            }

            $reservationItems = $this->reservationItemService->getAllReservationItems(
                keys: 'reservation_id',
                values: $reservation->id,
                relations: ['product:id,name', 'city:id,name']
            );

            $reservation->setRelation('items', $reservationItems);

            return response()->json([
                'data' => $this->formatCustomerReservation($reservation),
            ]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'show_reservation_failed',
                'entity_type' => 'Reservation',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'customer.reservations.show',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement de la reservation.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement de la reservation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function checkout(Request $request, int $reservationId)
    {
        $user = $request->user();

        try {
            $payload = DB::transaction(function () use ($user, $reservationId) {
                $this->releaseExpiredReservations($user->id);

                $reservation = Reservation::query()
                    ->with('items')
                    ->where('id', $reservationId)
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->first();

                if (! $reservation) {
                    throw ValidationException::withMessages([
                        'reservation' => ['Reservation introuvable.'],
                    ]);
                }

                if ($reservation->status !== 'active' || $reservation->is_expired) {
                    throw ValidationException::withMessages([
                        'reservation' => ['Seule une reservation active peut etre transformee en commande.'],
                    ]);
                }

                $cart = Cart::query()->firstOrCreate(
                    ['user_id' => $user->id],
                    ['status' => 'active']
                );

                $cart->items()->delete();

                $products = \App\Models\Product::query()
                    ->whereIn('id', $reservation->items->pluck('product_id')->all())
                    ->get(['id', 'price'])
                    ->keyBy('id');

                foreach ($reservation->items as $reservationItem) {
                    $product = $products->get((int) $reservationItem->product_id);

                    if (! $product) {
                        throw ValidationException::withMessages([
                            'reservation' => ['Un produit reserve est introuvable.'],
                        ]);
                    }

                    $cart->items()->create([
                        'product_id' => (int) $reservationItem->product_id,
                        'quantity' => (int) $reservationItem->quantity,
                        'unit_price' => (float) $product->price,
                        'city_id' => $reservationItem->city_id,
                        'inventory_id' => null,
                    ]);
                }

                if ((int) $reservation->cart_id !== (int) $cart->id) {
                    $reservation->update([
                        'cart_id' => $cart->id,
                    ]);
                }

                return [
                    'reservation' => $this->formatCustomerReservation($reservation->fresh(['items.product:id,name', 'items.city:id,name'])),
                    'cart_id' => $cart->id,
                ];
            });

            return response()->json([
                'message' => 'Reservation chargee dans le panier. Vous pouvez passer a la commande.',
                'data' => $payload,
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Impossible de preparer cette reservation pour la commande.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, int $reservationId)
    {
        $user = $request->user();

        try {
            DB::transaction(function () use ($user, $reservationId) {
                $this->releaseExpiredReservations($user->id);

                $reservation = Reservation::query()
                    ->with('items')
                    ->where('id', $reservationId)
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->first();

                if (! $reservation) {
                    throw ValidationException::withMessages([
                        'reservation' => ['Reservation introuvable.'],
                    ]);
                }

                if ($reservation->status !== 'active' || $reservation->is_expired) {
                    throw ValidationException::withMessages([
                        'reservation' => ['Seule une reservation active peut etre annulee.'],
                    ]);
                }

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

                $reservation->markReleased('cancelled_by_client');
            });

            return response()->json([
                'message' => 'Reservation annulee avec succes.',
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_reservation_failed',
                'entity_type' => 'Reservation',
                'entity_id' => $reservationId,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'customer.reservations.destroy',
                'status_code' => 500,
                'message' => 'Erreur lors de l annulation de la reservation.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Impossible d annuler cette reservation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function releaseExpiredReservations(int $userId): void
    {
        $reservations = Reservation::query()
            ->with('items')
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
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

            $reservation->markReleased('expired');
        }
    }

    private function formatCustomerReservationSummary(Reservation $reservation): array
    {
        $firstItem = $reservation->items->first();
        $itemsCount = $reservation->items->count();
        $totalQuantity = (int) $reservation->items->sum('quantity');
        $cityNames = $reservation->items
            ->pluck('city.name')
            ->filter()
            ->unique()
            ->values();

        return [
            'id' => $reservation->id,
            'encrypted_id' => $reservation->encrypted_id,
            'status' => $reservation->status,
            'quantity' => $totalQuantity,
            'items_count' => $itemsCount,
            'expires_at' => $reservation->expires_at?->toISOString(),
            'is_expired' => $reservation->is_expired,
            'product_id' => $itemsCount === 1 ? $firstItem?->product_id : null,
            'product_name' => $itemsCount === 1 ? $firstItem?->product?->name : $itemsCount.' articles',
            'city_id' => $itemsCount === 1 ? $firstItem?->city_id : null,
            'city_name' => $cityNames->count() === 1 ? $cityNames->first() : ($cityNames->count() > 1 ? 'Plusieurs villes' : null),
            'reserved_at' => $reservation->reserved_at?->toISOString(),
            'released_at' => $reservation->released_at?->toISOString(),
            'consumed_at' => $reservation->consumed_at?->toISOString(),
            'release_reason' => $reservation->release_reason,
            'items' => $reservation->items
                ->map(fn (ReservationItem $item) => [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product?->name,
                    'city_id' => $item->city_id,
                    'city_name' => $item->city?->name,
                    'quantity' => (int) $item->quantity,
                ])
                ->values()
                ->all(),
        ];
    }

    private function formatCustomerReservation(Reservation $reservation): array
    {
        return [
            'id' => $reservation->id,
            'encrypted_id' => $reservation->encrypted_id,
            'status' => $reservation->status,
            'expires_at' => $reservation->expires_at?->toISOString(),
            'is_expired' => $reservation->is_expired,
            'cart_id' => $reservation->cart_id,
            'order_id' => $reservation->order_id,
            'reserved_at' => $reservation->reserved_at?->toISOString(),
            'released_at' => $reservation->released_at?->toISOString(),
            'consumed_at' => $reservation->consumed_at?->toISOString(),
            'release_reason' => $reservation->release_reason,
            'items_count' => $reservation->items->count(),
            'quantity' => (int) $reservation->items->sum('quantity'),
            'items' => $reservation->items
                ->map(fn (ReservationItem $item) => [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product?->name,
                    'city_id' => $item->city_id,
                    'city_name' => $item->city?->name,
                    'quantity' => (int) $item->quantity,
                ])
                ->values()
                ->all(),
        ];
    }

    private function resolveReservationId(string $value): ?int
    {
        if (ctype_digit($value)) {
            return (int) $value;
        }

        return decrypt_to_int_or_null($value);
    }
}
