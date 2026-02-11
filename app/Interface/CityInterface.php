<?php

namespace App\Interface;

use App\Models\City;

interface CityInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?City;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?City;

    public function create(array $data): ?City;

    public function update(City $city, array $data): ?City;

    public function delete(City $city): void;
}