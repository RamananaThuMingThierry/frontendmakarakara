<?php

namespace App\Repositories;

use App\Interface\InventoryInterface;
use App\Models\Inventory;
use App\Repositories\BaseRepository;

class InventoryRepository extends BaseRepository implements InventoryInterface
{   
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Inventory::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Inventory
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Inventory::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Inventory
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Inventory::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?Inventory
    {
        return Inventory::create($data);
    }

    public function update(Inventory $inventory, array $data): ?Inventory
    {
        $inventory->update($data);
        return $inventory;
    }

    public function delete(Inventory $inventory): void
    {
        $inventory->delete();
    }
}