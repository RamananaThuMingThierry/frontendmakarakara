<?php

namespace App\Interface;

use App\Models\ReservationItem;

interface ReservationItemInterface{

    public function getAll(string|array|null $keys = null, mixed $values = null, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?ReservationItem;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?ReservationItem;

    public function create(array $data): ?ReservationItem;

    public function update(ReservationItem $reservationItem, array $data): ?ReservationItem;

    public function delete(ReservationItem $reservationItem): void;
}
