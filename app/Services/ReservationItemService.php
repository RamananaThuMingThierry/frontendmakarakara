<?php

namespace App\Services;

use App\Models\ReservationItem;
use App\Repositories\CityRepository;
use App\Repositories\ProductRepository;
use App\Repositories\ReservationItemRepository;
use App\Repositories\ReservationRepository;
use Illuminate\Validation\ValidationException;

class ReservationItemService
{
    public function __construct(
        private readonly ReservationItemRepository $reservationItemRepository,
        private readonly ReservationRepository $reservationRepository,
        private readonly ProductRepository $productRepository,
        private readonly CityRepository $cityRepository,
    ) {}

    public function getAllReservationItems(string|array|null $keys = null, mixed $values = null, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        return $this->reservationItemRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getReservationItemById(int|string $id, array $fields = ['*'], array $relations = [])
    {
        return $this->reservationItemRepository->getById($id, $fields, $relations);
    }

    public function getReservationItemByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [])
    {
        return $this->reservationItemRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createReservationItem(array $data): ReservationItem
    {
        $payload = $this->buildPayload($data);

        $reservationItem = $this->reservationItemRepository->create($payload);

        if (! $reservationItem) {
            throw ValidationException::withMessages([
                'reservation_item' => ["Impossible de creer l'item de reservation."],
            ]);
        }

        return $reservationItem;
    }

    public function updateReservationItem(ReservationItem $reservationItem, array $data): ReservationItem
    {
        $payload = $this->buildPayload($data, $reservationItem);

        if (empty($payload)) {
            throw ValidationException::withMessages([
                'reservation_item' => ['Aucune donnee a mettre a jour.'],
            ]);
        }

        $updated = $this->reservationItemRepository->update($reservationItem, $payload);

        if (! $updated) {
            throw ValidationException::withMessages([
                'reservation_item' => ["Impossible de mettre a jour l'item de reservation."],
            ]);
        }

        return $updated;
    }

    public function deleteReservationItem(ReservationItem $reservationItem): void
    {
        $this->reservationItemRepository->delete($reservationItem);
    }

    private function buildPayload(array $data, ?ReservationItem $reservationItem = null): array
    {
        $payload = [];

        if (array_key_exists('reservation_id', $data) || ! $reservationItem) {
            if (! array_key_exists('reservation_id', $data)) {
                throw ValidationException::withMessages([
                    'reservation_id' => ['Le champ reservation_id est requis.'],
                ]);
            }

            $reservationId = (int) $data['reservation_id'];
            $reservation = $this->reservationRepository->getById($reservationId, ['id']);

            if (! $reservation) {
                throw ValidationException::withMessages([
                    'reservation_id' => ['Reservation introuvable.'],
                ]);
            }

            $payload['reservation_id'] = $reservationId;
        }

        if (array_key_exists('product_id', $data) || ! $reservationItem) {
            if (! array_key_exists('product_id', $data)) {
                throw ValidationException::withMessages([
                    'product_id' => ['Le champ product_id est requis.'],
                ]);
            }

            $productId = (int) $data['product_id'];
            $product = $this->productRepository->getById($productId, ['id']);

            if (! $product) {
                throw ValidationException::withMessages([
                    'product_id' => ['Produit introuvable.'],
                ]);
            }

            $payload['product_id'] = $productId;
        }

        if (array_key_exists('city_id', $data) || ! $reservationItem) {
            if (! array_key_exists('city_id', $data)) {
                throw ValidationException::withMessages([
                    'city_id' => ['Le champ city_id est requis.'],
                ]);
            }

            $cityId = (int) $data['city_id'];
            $city = $this->cityRepository->getById($cityId, ['id']);

            if (! $city) {
                throw ValidationException::withMessages([
                    'city_id' => ['Ville introuvable.'],
                ]);
            }

            $payload['city_id'] = $cityId;
        }

        if (array_key_exists('quantity', $data) || ! $reservationItem) {
            if (! array_key_exists('quantity', $data)) {
                throw ValidationException::withMessages([
                    'quantity' => ['Le champ quantity est requis.'],
                ]);
            }

            $quantity = (int) $data['quantity'];

            if ($quantity < 1) {
                throw ValidationException::withMessages([
                    'quantity' => ['La quantite doit etre superieure ou egale a 1.'],
                ]);
            }

            $payload['quantity'] = $quantity;
        }

        return $payload;
    }
}
