<?php

namespace App\Repositories;

use App\Interface\UserInterface;
use App\Models\User;

class UserRepository extends BaseRepository implements UserInterface
{
        public function getAll(string|array $keys, mixed $values, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false, ?int $paginate = null){
        $fields = $this->withRequiredColumns($fields);

        $q = User::query()->select($fields);
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyTrashed($q, $withTrashed, $onlyTrashed);
        $q = $this->applyFilter($q, $keys, $values);

        return $paginate ? $q->paginate($paginate) : $q->get(); 
    }

    public function getById(int|string $id, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?User
    {
        $fields = $this->withRequiredColumns($fields);

        $q = User::query()->select($fields);
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyTrashed($q, $withTrashed, $onlyTrashed);

        return $q->findOrFail($id);
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?User
    {
        $fields = $this->withRequiredColumns($fields);

        $q = User::query()->select($fields);
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyTrashed($q, $withTrashed, $onlyTrashed);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first();
    }

    public function create(array $data): ?User
    {
        return User::create($data);
    }

    public function update(User $user, array $data): ?User
    {
        $user->update($data);
        return $user;
    }

    public function delete(User $user): void
    {
       $user->delete();
    }

    public function restore(int $id): ?User
    {
        $user = User::withTrashed()->find($id);
        if ($user && $user->trashed()) $user->restore();
        return $user->fresh();
    }

    public function forceDelete(int $id): void
    {
        $user = User::withTrashed()->find($id);
        if ($user) $user->forceDelete();
    }
}