<?php

namespace App\Repositories;

use App\Interface\ReservationItemInterface;
use App\Models\ReservationItem;

class ReservationItemRepository extends BaseRepository implements ReservationItemInterface
{
    public function getAll(string|array|null $keys = null, mixed $values = null, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ReservationItem::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?ReservationItem
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ReservationItem::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?ReservationItem
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ReservationItem::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?ReservationItem
    {
        return ReservationItem::create($data);
    }

    public function update(ReservationItem $reservationItem, array $data): ?ReservationItem
    {
        $reservationItem->update($data);
        return $reservationItem;
    }

    public function delete(ReservationItem $reservationItem): void
    {
        $reservationItem->delete();
    }
}
