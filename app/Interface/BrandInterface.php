<?php

namespace App\Interface;

use App\Models\Brand;

interface BrandInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Brand;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Brand;

    public function create(array $data): ?Brand;

    public function update(Brand $brand, array $data): ?Brand;

    public function delete(Brand $brand): void;

}