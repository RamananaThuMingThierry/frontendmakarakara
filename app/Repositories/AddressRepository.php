<?php

namespace App\Repositories;

use App\Interface\AddressInterface;
use App\Models\Address;
use App\Repositories\BaseRepository;

class AddressRepository extends BaseRepository implements AddressInterface
{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false, ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Address::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);
        $query = $this->applyTrashed($query, $withTrashed, $onlyTrashed);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?Address
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Address::query();
        $query = $this->applyRelation($query, $relations);
        $query = $this->applyTrashed($query, $withTrashed, $onlyTrashed);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?Address
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Address::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);
        $query = $this->applyTrashed($query, $withTrashed, $onlyTrashed);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?Address
    {
        return Address::create($data);
    }

    public function update(Address $address, array $data): ?Address
    {
        $address->update($data);
        return $address;
    }

    public function delete(Address $address): void
    {
        $address->delete();
    }

    public function restore(Address $address): ?Address
    {
        if ($address && $address->trashed()) $address->restore();
        return $address->fresh();
    }

    public function forceDelete(Address $address): void
    {
        if ($address) $address->forceDelete();
    }
}
