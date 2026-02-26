<?php

namespace App\Repositories;

use App\Interface\CartItemInterface;
use App\Models\CartItem;
use App\Repositories\BaseRepository;

class CartItemRepository extends BaseRepository implements CartItemInterface
{   
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = CartItem::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?CartItem
    {
        $fields = $this->withRequiredColumns($fields);

        $query = CartItem::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?CartItem
    {
        $fields = $this->withRequiredColumns($fields);

        $query = CartItem::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?CartItem
    {
        return CartItem::create($data);
    }

    public function update(CartItem $cartItem, array $data): ?CartItem
    {
        $cartItem->update($data);
        return $cartItem;
    }

    public function delete(CartItem $cartItem): void
    {
        $cartItem->delete();
    }

    public function restore(int $id): ?CartItem
    {
        $cartItem = CartItem::withTrashed()->find($id);
        if ($cartItem && $cartItem->trashed()) $cartItem->restore();
        return $cartItem->fresh();
    }

    public function forceDelete(int $id): void
    {
        $cartItem = CartItem::withTrashed()->find($id);
        if ($cartItem) $cartItem->forceDelete();
    }
}