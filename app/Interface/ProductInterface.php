<?php

namespace App\Interface;

use App\Models\Product;

interface ProductInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false, ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false,): ?Product;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false,): ?Product;

    public function create(array $data): ?Product;

    public function update(Product $product, array $data): ?Product;

    public function delete(Product $product): void;
}