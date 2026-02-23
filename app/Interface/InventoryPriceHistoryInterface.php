<?php

namespace App\Interface;

use App\Models\InventoryPriceHistory;

interface InventoryPriceHistoryInterface
{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?InventoryPriceHistory;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?InventoryPriceHistory;

    public function create(array $data): ?InventoryPriceHistory;
    
    public function update(InventoryPriceHistory $inventoryPriceHistory, array $data): ?InventoryPriceHistory;

    public function delete(InventoryPriceHistory $inventoryPriceHistory): void;
}