<?php

namespace App\Repositories;

use App\Interface\PaymentMethodInterface;
use App\Models\PaymentMethod;
use App\Repositories\BaseRepository;

class PaymentMethodRepository extends BaseRepository implements PaymentMethodInterface
{   
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = PaymentMethod::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?PaymentMethod
    {
        $fields = $this->withRequiredColumns($fields);

        $query = PaymentMethod::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?PaymentMethod
    {
        $fields = $this->withRequiredColumns($fields);

        $query = PaymentMethod::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?PaymentMethod
    {
        return PaymentMethod::create($data);
    }

    public function update(PaymentMethod $cartItem, array $data): ?PaymentMethod
    {
        $cartItem->update($data);
        return $cartItem;
    }

    public function delete(PaymentMethod $product): void
    {
        $product->delete();
    }

    public function restore(int $id): ?PaymentMethod
    {
        $cartItem = PaymentMethod::withTrashed()->find($id);
        if ($cartItem && $cartItem->trashed()) $cartItem->restore();
        return $cartItem->fresh();
    }

    public function forceDelete(int $id): void
    {
        $cartItem = PaymentMethod::withTrashed()->find($id);
        if ($cartItem) $cartItem->forceDelete();
    }
}