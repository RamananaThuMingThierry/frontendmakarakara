<?php

namespace App\Http\Controllers\WEB\ADMIN;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\ReservationItem;
use App\Services\ActivityLogService;
use App\Services\ReservationItemService;
use App\Services\ReservationService;
use Illuminate\Support\Facades\Auth;
use Throwable;

class ReservationController extends Controller
{
    public function __construct(
        private readonly ReservationService $reservationService,
        private readonly ReservationItemService $reservationItemService,
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function index()
    {
        try {
            $reservations = $this->reservationService
                ->getAllReservations(
                    relations: ['items.product:id,name', 'items.city:id,name', 'user:id,name,email', 'createdBy:id,name,email']
                )
                ->sortByDesc('created_at')
                ->map(fn (Reservation $reservation) => $this->formatReservation($reservation))
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
                'route' => 'admin.reservations.index',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des reservations.',
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

    public function show(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'show_reservation_failed',
                'entity_type' => 'Reservation',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.reservations.show',
                'status_code' => 400,
                'message' => 'ID de reservation invalide.',
                'metadata' => [
                    'encrypted_id' => $encryptedId,
                ],
            ]);

            return response()->json([
                'message' => 'ID de reservation invalide.',
            ], 400);
        }

        try {
            $reservation = $this->reservationService->getReservationById(
                $id,
                relations: ['items.product:id,name,price', 'items.city:id,name', 'user:id,name,email', 'createdBy:id,name,email']
            );

            if (! $reservation) {
                return response()->json([
                    'message' => 'Reservation introuvable.',
                ], 404);
            }

            $reservationItems = $this->reservationItemService->getAllReservationItems(
                keys: 'reservation_id',
                values: $reservation->id,
                relations: ['product:id,name,price', 'city:id,name']
            );

            $reservation->setRelation('items', $reservationItems);

            return response()->json([
                'data' => $this->formatReservation($reservation),
            ]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'show_reservation_failed',
                'entity_type' => 'Reservation',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.reservations.show',
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

    private function formatReservation(Reservation $reservation): array
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
            'user_id' => $reservation->user_id,
            'user_name' => $reservation->user?->name,
            'user_email' => $reservation->user?->email,
            'product_id' => $itemsCount === 1 ? $firstItem?->product_id : null,
            'product_name' => $itemsCount === 1 ? $firstItem?->product?->name : $itemsCount.' articles',
            'city_id' => $itemsCount === 1 ? $firstItem?->city_id : null,
            'city_name' => $cityNames->count() === 1 ? $cityNames->first() : ($cityNames->count() > 1 ? 'Plusieurs villes' : null),
            'quantity' => $totalQuantity,
            'items_count' => $itemsCount,
            'status' => $reservation->status,
            'cart_id' => $reservation->cart_id,
            'order_id' => $reservation->order_id,
            'expires_at' => $reservation->expires_at?->toISOString(),
            'reserved_at' => $reservation->reserved_at?->toISOString(),
            'released_at' => $reservation->released_at?->toISOString(),
            'consumed_at' => $reservation->consumed_at?->toISOString(),
            'release_reason' => $reservation->release_reason,
            'created_at' => $reservation->created_at?->toISOString(),
            'updated_at' => $reservation->updated_at?->toISOString(),
            'items' => $reservation->items
                ->map(fn (ReservationItem $item) => $this->formatReservationItem($item))
                ->values()
                ->all(),
            'history' => $this->buildHistory($reservation),
        ];
    }

    private function formatReservationItem(ReservationItem $reservationItem): array
    {
        return [
            'id' => $reservationItem->id,
            'reservation_id' => $reservationItem->reservation_id,
            'product_id' => $reservationItem->product_id,
            'product_name' => $reservationItem->product?->name,
            'product_price' => $reservationItem->product?->price !== null ? (float) $reservationItem->product->price : null,
            'city_id' => $reservationItem->city_id,
            'city_name' => $reservationItem->city?->name,
            'quantity' => (int) $reservationItem->quantity,
        ];
    }

    private function buildHistory(Reservation $reservation): array
    {
        $events = collect();
        $quantity = (int) $reservation->items->sum('quantity');

        if ($reservation->reserved_at) {
            $events->push([
                'action' => 'created',
                'quantity' => $quantity,
                'old_status' => null,
                'new_status' => 'active',
                'note' => $reservation->reference_type,
                'release_reason' => null,
                'user_name' => $reservation->createdBy?->name ?? $reservation->user?->name,
                'action_at' => $reservation->reserved_at->toISOString(),
            ]);
        }

        if ($reservation->released_at) {
            $events->push([
                'action' => 'released',
                'quantity' => $quantity,
                'old_status' => 'active',
                'new_status' => 'released',
                'note' => $reservation->reference_type,
                'release_reason' => $reservation->release_reason,
                'user_name' => $reservation->createdBy?->name ?? $reservation->user?->name,
                'action_at' => $reservation->released_at->toISOString(),
            ]);
        }

        if ($reservation->consumed_at) {
            $events->push([
                'action' => 'consumed',
                'quantity' => $quantity,
                'old_status' => 'active',
                'new_status' => 'consumed',
                'note' => $reservation->reference_type,
                'release_reason' => null,
                'user_name' => $reservation->createdBy?->name ?? $reservation->user?->name,
                'action_at' => $reservation->consumed_at->toISOString(),
            ]);
        }

        return $events
            ->sortByDesc('action_at')
            ->values()
            ->all();
    }
}
