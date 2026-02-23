<?php

namespace App\Repositories;

use App\Interface\StockReservationInterface;
use App\Models\StockReservation;
use App\Repositories\BaseRepository;

class StockReservationRepository extends BaseRepository implements StockReservationInterface
{   
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = StockReservation::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?StockReservation
    {
        $fields = $this->withRequiredColumns($fields);

        $query = StockReservation::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?StockReservation
    {
        $fields = $this->withRequiredColumns($fields);

        $query = StockReservation::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?StockReservation
    {
        return StockReservation::create($data);
    }

    public function delete(StockReservation $reservation): void
    {
        $reservation->delete();
    }
}