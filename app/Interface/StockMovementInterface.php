<?php

namespace App\Interface;

use App\Models\StockMovement;

interface StockMovementInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?StockMovement;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?StockMovement;

    public function create(array $data): ?StockMovement;

    public function delete(StockMovement $movement): void;
}