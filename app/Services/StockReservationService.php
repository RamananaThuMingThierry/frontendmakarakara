<?php

namespace App\Services;

use App\Models\StockReservation;
use App\Repositories\StockReservationRepository;
use Illuminate\Validation\ValidationException;

class StockReservationService
{
    public function __construct(private readonly StockReservationRepository $stockReservationRepository) {}

    public function getAllStockReservations(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null) {
        return $this->stockReservationRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getStockReservationById(int|string $id, array $fields = ['*'], array $relations = [])
    {
        return $this->stockReservationRepository->getById($id, $fields, $relations);
    }

    public function getStockReservationByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [])
    {
        return $this->stockReservationRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createStockReservation(array $data): StockReservation
    {
        $errors = [];

        if (!array_key_exists('product_id', $data)) {
            $errors['product_id'][] = "Le champ 'product_id' est requis.";
        }
        if (!array_key_exists('city_id', $data)) {
            $errors['city_id'][] = "Le champ 'city_id' est requis.";
        }
        if (!array_key_exists('quantity', $data)) {
            $errors['quantity'][] = "Le champ 'quantity' est requis.";
        }

        // status optionnel: par défaut active
        $status = $data['status'] ?? 'active';
        if (!in_array($status, ['active', 'released', 'consumed'], true)) {
            $errors['status'][] = "Le champ 'status' doit être: active, released ou consumed.";
        }

        // petite validation quantité
        if (array_key_exists('quantity', $data) && (!is_numeric($data['quantity']) || (int)$data['quantity'] <= 0)) {
            $errors['quantity'][] = "Le champ 'quantity' doit être un entier > 0.";
        }

        // cohérence polymorphique : si l’un est là, l’autre aussi (optionnel mais conseillé)
        $hasType = array_key_exists('reference_type', $data) && !empty($data['reference_type']);
        $hasId   = array_key_exists('reference_id', $data) && !empty($data['reference_id']);
        
        if ($hasType xor $hasId) {
            $errors['reference'][] = "Si tu fournis 'reference_type', tu dois aussi fournir 'reference_id' (et inversement).";
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }

        $payload = [
            'product_id'     => (int) $data['product_id'],
            'city_id'        => (int) $data['city_id'],
            'quantity'       => (int) $data['quantity'],
            'status'         => $status,
            'reference_type' => $data['reference_type'] ?? null,
            'reference_id'   => $data['reference_id'] ?? null,
            'created_by'     => $data['created_by'] ?? null,
        ];

        $reservation = $this->stockReservationRepository->create($payload);

        if (!$reservation) {
            throw ValidationException::withMessages([
                'reservation' => ["Impossible de créer la réservation de stock."],
            ]);
        }

        return $reservation;
    }

    public function releaseStockReservation(int|string $id): StockReservation
    {
        $reservation = $this->getStockReservationById($id);

        if (!$reservation) {
            throw ValidationException::withMessages([
                'id' => ["Réservation introuvable."],
            ]);
        }

        if ($reservation->status !== 'active') {
            throw ValidationException::withMessages([
                'status' => ["Seule une réservation 'active' peut être libérée."],
            ]);
        }

        $reservation->markReleased();
        return $reservation;
    }

    public function consumeStockReservation(int|string $id): StockReservation
    {
        $reservation = $this->getStockReservationById($id);

        if (!$reservation) {
            throw ValidationException::withMessages([
                'id' => ["Réservation introuvable."],
            ]);
        }

        if ($reservation->status !== 'active') {
            throw ValidationException::withMessages([
                'status' => ["Seule une réservation 'active' peut être consommée."],
            ]);
        }

        $reservation->markConsumed();
        return $reservation;
    }

    public function deleteStockReservation(int|string $id): void
    {
        $reservation = $this->getStockReservationById($id);

        if (!$reservation) {
            throw ValidationException::withMessages([
                'id' => ["Réservation introuvable."],
            ]);
        }

        // Option : interdire suppression si consommée
        if ($reservation->status === 'consumed') {
            throw ValidationException::withMessages([
                'status' => ["Impossible de supprimer une réservation 'consumed'."],
            ]);
        }

        $this->stockReservationRepository->delete($reservation);
    }
}