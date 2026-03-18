<?php

namespace App\Interface;

use App\Models\Reservation;

interface ReservationInterface{

    public function getAll(string|array|null $keys = null, mixed $values = null, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Reservation;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Reservation;

    public function create(array $data): ?Reservation;

    public function update(Reservation $reservation, array $data): ?Reservation;

    public function delete(Reservation $reservation): void;
}
