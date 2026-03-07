<?php

namespace App\Repositories;

use App\Interface\InventoryPriceHistoryInterface;
use App\Models\InventoryPriceHistory;
use App\Repositories\BaseRepository;

class InventoryPriceHistoryRepository extends BaseRepository implements InventoryPriceHistoryInterface
{   
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = InventoryPriceHistory::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?InventoryPriceHistory
    {
        $fields = $this->withRequiredColumns($fields);

        $query = InventoryPriceHistory::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?InventoryPriceHistory
    {
        $fields = $this->withRequiredColumns($fields);

        $query = InventoryPriceHistory::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?InventoryPriceHistory
    {
        return InventoryPriceHistory::create($data);
    }

    public function update(InventoryPriceHistory $inventoryPriceHistory, array $data): ?InventoryPriceHistory
    {
        $inventoryPriceHistory->update($data);
        return $inventoryPriceHistory;
    }

    public function delete(InventoryPriceHistory $inventoryPriceHistory): void
    {
        $inventoryPriceHistory->delete();
    }
}