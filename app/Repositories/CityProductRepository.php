<?php

namespace App\Repositories;

use App\Interface\CityProductInterface;
use App\Models\CityProduct;
use App\Repositories\BaseRepository;

class CityProductRepository extends BaseRepository implements CityProductInterface
{   
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = CityProduct::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?CityProduct
    {
        $fields = $this->withRequiredColumns($fields);

        $query = CityProduct::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?CityProduct
    {
        $fields = $this->withRequiredColumns($fields);

        $query = CityProduct::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?CityProduct
    {
        return CityProduct::create($data);
    }

    public function update(CityProduct $cityProduct, array $data): ?CityProduct
    {
        $cityProduct->update($data);
        return $cityProduct;
    }

    public function delete(CityProduct $cityProduct): void
    {
        $cityProduct->delete();
    }
}