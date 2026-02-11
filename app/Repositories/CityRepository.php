<?php

namespace App\Repositories;

use App\Interface\CityInterface;
use App\Models\City;
use App\Repositories\BaseRepository;

class CityRepository extends BaseRepository implements CityInterface
{   
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = City::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?City
    {
        $fields = $this->withRequiredColumns($fields);

        $query = City::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?City
    {
        $fields = $this->withRequiredColumns($fields);

        $query = City::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?City
    {
        return City::create($data);
    }

    public function update(City $city, array $data): ?City
    {
        $city->update($data);
        return $city;
    }

    public function delete(City $city): void
    {
        $city->delete();
    }
}