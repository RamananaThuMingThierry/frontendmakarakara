<?php

namespace App\Interface;

use App\Models\CartItem;

interface CartItemInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?CartItem;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?CartItem;

    public function create(array $data): ?CartItem;

    public function update(CartItem $cartItem, array $data): ?CartItem;

    public function delete(CartItem $cartItem): void;
}