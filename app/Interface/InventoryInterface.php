<?php

namespace App\Interface;

use App\Models\Inventory;

interface InventoryInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Inventory;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Inventory;

    public function create(array $data): ?Inventory;

    public function update(Inventory $inventory, array $data): ?Inventory;

    public function delete(Inventory $inventory): void;
}