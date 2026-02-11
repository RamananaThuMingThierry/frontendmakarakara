<?php

namespace App\Repositories;

use App\Models\Brand;
use App\Interface\BrandInterface;
use App\Repositories\BaseRepository;

class BrandRepository extends BaseRepository implements BrandInterface
{   
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Brand::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Brand
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Brand::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Brand
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Brand::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?Brand
    {
        return Brand::create($data);
    }

    public function update(Brand $brand, array $data): ?Brand
    {
        $brand->update($data);
        return $brand;
    }

    public function delete(Brand $brand): void
    {
        $brand->delete();
    }
}