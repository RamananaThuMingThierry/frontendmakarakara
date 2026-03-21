<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\ContactUs;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class NotificationService
{
    public function notifyAdmins(array $payload): void
    {
        $adminIds = User::role('admin')->pluck('id');

        foreach ($adminIds as $adminId) {
            Notification::create([
                'user_id' => (int) $adminId,
                'type' => (string) ($payload['type'] ?? 'system'),
                'category' => (string) ($payload['category'] ?? 'system'),
                'title' => (string) ($payload['title'] ?? 'Notification'),
                'message' => (string) ($payload['message'] ?? ''),
                'severity' => (string) ($payload['severity'] ?? 'info'),
                'entity_type' => $payload['entity_type'] ?? null,
                'entity_id' => $payload['entity_id'] ?? null,
                'action_url' => $payload['action_url'] ?? null,
                'metadata' => $payload['metadata'] ?? null,
                'read_at' => null,
            ]);
        }
    }

    public function notifyNewOrder(Order $order): void
    {
        $order->loadMissing('user');

        $this->notifyAdmins([
            'type' => 'order_created',
            'category' => 'order',
            'title' => 'Nouvelle commande',
            'message' => sprintf(
                'Commande %s creee par %s pour %s MGA.',
                $order->order_number,
                $order->user?->name ?? 'un client',
                number_format((float) $order->total, 0, ',', ' ')
            ),
            'severity' => 'info',
            'entity_type' => Order::class,
            'entity_id' => $order->id,
            'action_url' => '/admin/orders',
            'metadata' => [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->user?->name,
                'total' => (float) $order->total,
            ],
        ]);
    }

    public function notifyNewReservation(Reservation $reservation): void
    {
        $reservation->loadMissing(['user', 'items.product', 'items.city']);
        $firstItem = $reservation->items->first();

        $this->notifyAdmins([
            'type' => 'reservation_created',
            'category' => 'reservation',
            'title' => 'Nouvelle reservation',
            'message' => sprintf(
                'Reservation #%d creee par %s pour %d article(s).',
                $reservation->id,
                $reservation->user?->name ?? 'un client',
                (int) $reservation->items->sum('quantity')
            ),
            'severity' => 'info',
            'entity_type' => Reservation::class,
            'entity_id' => $reservation->id,
            'action_url' => '/admin/reservations',
            'metadata' => [
                'reservation_id' => $reservation->id,
                'customer_name' => $reservation->user?->name,
                'product_name' => $firstItem?->product?->name,
                'city_name' => $firstItem?->city?->name,
                'quantity' => (int) $reservation->items->sum('quantity'),
            ],
        ]);
    }

    public function notifyNewContact(ContactUs $contact): void
    {
        $this->notifyAdmins([
            'type' => 'contact_created',
            'category' => 'contact',
            'title' => 'Nouveau message contact',
            'message' => sprintf(
                '%s a envoye un message%s.',
                $contact->name,
                $contact->subject ? ' : '.$contact->subject : ''
            ),
            'severity' => 'info',
            'entity_type' => ContactUs::class,
            'entity_id' => $contact->id,
            'action_url' => '/admin/contacts',
            'metadata' => [
                'contact_id' => $contact->id,
                'name' => $contact->name,
                'email' => $contact->email,
                'subject' => $contact->subject,
            ],
        ]);
    }

    public function notifyNewReview(Review $review): void
    {
        $review->loadMissing(['user', 'product']);

        $this->notifyAdmins([
            'type' => 'review_created',
            'category' => 'review',
            'title' => 'Nouvel avis produit',
            'message' => sprintf(
                'Nouvel avis de %s sur %s (%s/5).',
                $review->user?->name ?? 'un client',
                $review->product?->name ?? 'un produit',
                (string) $review->rating
            ),
            'severity' => 'info',
            'entity_type' => Review::class,
            'entity_id' => $review->id,
            'action_url' => null,
            'metadata' => [
                'review_id' => $review->id,
                'product_id' => $review->product_id,
                'product_name' => $review->product?->name,
                'user_name' => $review->user?->name,
                'rating' => $review->rating,
            ],
        ]);
    }

    public function notifyInventoryAlert(Inventory $inventory, ?string $previousStatus = null): void
    {
        $inventory->loadMissing(['product:id,name', 'city:id,name']);

        $currentStatus = (string) $inventory->status;
        if (! in_array($currentStatus, ['low', 'out_of_stock'], true)) {
            return;
        }

        if ($previousStatus === $currentStatus) {
            return;
        }

        $severity = $currentStatus === 'out_of_stock' ? 'danger' : 'warning';
        $title = $currentStatus === 'out_of_stock' ? 'Rupture de stock' : 'Stock faible';

        $this->notifyAdmins([
            'type' => 'inventory_alert_'.$currentStatus,
            'category' => 'inventory',
            'title' => $title,
            'message' => sprintf(
                '%s est en %s a %s. Quantite restante : %d.',
                $inventory->product?->name ?? 'Un produit',
                $currentStatus === 'out_of_stock' ? 'rupture de stock' : 'stock faible',
                $inventory->city?->name ?? 'une ville',
                (int) $inventory->quantity
            ),
            'severity' => $severity,
            'entity_type' => Inventory::class,
            'entity_id' => $inventory->id,
            'action_url' => null,
            'metadata' => [
                'inventory_id' => $inventory->id,
                'product_id' => $inventory->product_id,
                'product_name' => $inventory->product?->name,
                'city_id' => $inventory->city_id,
                'city_name' => $inventory->city?->name,
                'quantity' => (int) $inventory->quantity,
                'min_stock' => (int) $inventory->min_stock,
                'status' => $currentStatus,
                'previous_status' => $previousStatus,
            ],
        ]);
    }

    public function paginateForUser(User $user, int $perPage = 15, bool $unreadOnly = false): LengthAwarePaginator
    {
        $query = Notification::query()
            ->where('user_id', $user->id)
            ->latest();

        if ($unreadOnly) {
            $query->unread();
        }

        return $query->paginate($perPage);
    }

    public function recentForUser(User $user, int $limit = 6): Collection
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function unreadCountForUser(User $user): int
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->unread()
            ->count();
    }

    public function markAsReadForUser(User $user, int $notificationId): ?Notification
    {
        $notification = Notification::query()
            ->where('user_id', $user->id)
            ->where('id', $notificationId)
            ->first();

        if (! $notification) {
            return null;
        }

        if (! $notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return $notification->fresh();
    }

    public function markAllAsReadForUser(User $user): int
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);
    }
}
