<?php

namespace App\Repositories;

use App\Interface\StockMovementInterface;
use App\Models\StockMovement;
use App\Repositories\BaseRepository;

class StockMouvementRepository extends BaseRepository implements StockMovementInterface
{   
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = StockMovement::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?StockMovement
    {
        $fields = $this->withRequiredColumns($fields);

        $query = StockMovement::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?StockMovement
    {
        $fields = $this->withRequiredColumns($fields);

        $query = StockMovement::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?StockMovement
    {
        return StockMovement::create($data);
    }

    public function delete(StockMovement $movement): void
    {
        $movement->delete();
    }
}