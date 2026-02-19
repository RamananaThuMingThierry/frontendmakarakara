<?php

namespace App\Interface;

use App\Models\CityProduct;

interface CityProductInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?CityProduct;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?CityProduct;

    public function create(array $data): ?CityProduct;

    public function update(CityProduct $cityProduct, array $data): ?CityProduct;

    public function delete(CityProduct $cityProduct): void;
}