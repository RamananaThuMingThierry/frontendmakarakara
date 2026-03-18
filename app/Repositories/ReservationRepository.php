<?php

namespace App\Repositories;

use App\Interface\ReservationInterface;
use App\Models\Reservation;

class ReservationRepository extends BaseRepository implements ReservationInterface
{
    public function getAll(string|array|null $keys = null, mixed $values = null, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Reservation::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Reservation
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Reservation::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Reservation
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Reservation::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?Reservation
    {
        return Reservation::create($data);
    }

    public function update(Reservation $reservation, array $data): ?Reservation
    {
        $reservation->update($data);
        return $reservation;
    }

    public function delete(Reservation $reservation): void
    {
        $reservation->delete();
    }
}
