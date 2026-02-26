<?php

namespace App\Repositories;

use App\Interface\CartInterface;
use App\Models\Cart;
use App\Repositories\BaseRepository;

class CartRepository extends BaseRepository implements CartInterface
{   
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Cart::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Cart
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Cart::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Cart
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Cart::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?Cart
    {
        return Cart::create($data);
    }

    public function update(Cart $cart, array $data): ?Cart
    {
        $cart->update($data);
        return $cart;
    }

    public function delete(Cart $product): void
    {
        $product->delete();
    }

    public function restore(int $id): ?Cart
    {
        $cart = Cart::withTrashed()->find($id);
        if ($cart && $cart->trashed()) $cart->restore();
        return $cart->fresh();
    }

    public function forceDelete(int $id): void
    {
        $cart = Cart::withTrashed()->find($id);
        if ($cart) $cart->forceDelete();
    }
}