<?php

namespace App\Interface;

use App\Models\StockReservation;

interface StockReservationInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?StockReservation;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?StockReservation;

    public function create(array $data): ?StockReservation;
    
    public function delete(StockReservation $reservation): void;
}