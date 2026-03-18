<?php

namespace App\Services;

use App\Models\Reservation;
use App\Repositories\ReservationRepository;
use Illuminate\Validation\ValidationException;

class ReservationService
{
    public function __construct(private readonly ReservationRepository $reservationRepository) {}

    public function getAllReservations(string|array|null $keys = null, mixed $values = null, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        return $this->reservationRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getReservationById(int|string $id, array $fields = ['*'], array $relations = [])
    {
        return $this->reservationRepository->getById($id, $fields, $relations);
    }

    public function getReservationByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [])
    {
        return $this->reservationRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createReservation(array $data): Reservation
    {
        $errors = [];

        if (!array_key_exists('user_id', $data)) {
            $errors['user_id'][] = "Le champ 'user_id' est requis.";
        }

        if (!array_key_exists('cart_id', $data) && !array_key_exists('order_id', $data)) {
            $errors['reference'][] = "Le champ 'cart_id' ou 'order_id' est requis.";
        }

        $status = $data['status'] ?? 'active';
        if (!in_array($status, ['active', 'released', 'consumed'], true)) {
            $errors['status'][] = "Le champ 'status' doit etre: active, released ou consumed.";
        }

        $hasType = array_key_exists('reference_type', $data) && !empty($data['reference_type']);
        $hasId = array_key_exists('reference_id', $data) && !empty($data['reference_id']);

        if ($hasType xor $hasId) {
            $errors['reference'][] = "Si tu fournis 'reference_type', tu dois aussi fournir 'reference_id' et inversement.";
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }

        $payload = [
            'user_id' => (int) $data['user_id'],
            'cart_id' => $data['cart_id'] ?? null,
            'order_id' => $data['order_id'] ?? null,
            'status' => $status,
            'expires_at' => $data['expires_at'] ?? null,
            'reference_type' => $data['reference_type'] ?? null,
            'reference_id' => $data['reference_id'] ?? null,
            'created_by' => $data['created_by'] ?? null,
            'reserved_at' => $data['reserved_at'] ?? now(),
        ];

        $reservation = $this->reservationRepository->create($payload);

        if (! $reservation) {
            throw ValidationException::withMessages([
                'reservation' => ["Impossible de creer la reservation."],
            ]);
        }

        return $reservation;
    }

    public function releaseReservation(int|string $id): Reservation
    {
        $reservation = $this->getReservationById($id);

        if (! $reservation) {
            throw ValidationException::withMessages([
                'id' => ["Reservation introuvable."],
            ]);
        }

        if ($reservation->status !== 'active') {
            throw ValidationException::withMessages([
                'status' => ["Seule une reservation 'active' peut etre liberee."],
            ]);
        }

        $reservation->markReleased();

        return $reservation;
    }

    public function consumeReservation(int|string $id): Reservation
    {
        $reservation = $this->getReservationById($id);

        if (! $reservation) {
            throw ValidationException::withMessages([
                'id' => ["Reservation introuvable."],
            ]);
        }

        if ($reservation->status !== 'active') {
            throw ValidationException::withMessages([
                'status' => ["Seule une reservation 'active' peut etre consommee."],
            ]);
        }

        $reservation->markConsumed();

        return $reservation;
    }

    public function deleteReservation(int|string $id): void
    {
        $reservation = $this->getReservationById($id);

        if (! $reservation) {
            throw ValidationException::withMessages([
                'id' => ["Reservation introuvable."],
            ]);
        }

        if ($reservation->status === 'consumed') {
            throw ValidationException::withMessages([
                'status' => ["Impossible de supprimer une reservation 'consumed'."],
            ]);
        }

        $this->reservationRepository->delete($reservation);
    }
}
