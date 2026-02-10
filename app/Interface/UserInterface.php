<?php

namespace App\Interface;

use App\Models\User;

interface UserInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false, ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?User;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?User;

    public function create(array $data): ?User;

    public function update(User $user, array $data): ?User;

    public function delete(User $user): void;

    public function restore(int $id): ?User;

    public function forceDelete(int $id): void;
}   