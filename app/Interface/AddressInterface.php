<?php

namespace App\Interface;

use App\Models\Address;

interface AddressInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false, ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?Address;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?Address;

    public function create(array $data): ?Address;

    public function update(Address $address, array $data): ?Address;

    public function delete(Address $address): void;
}
