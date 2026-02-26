<?php

namespace App\Interface;

use App\Models\Cart;

interface CartInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Cart;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Cart;

    public function create(array $data): ?Cart;

    public function update(Cart $cart, array $data): ?Cart;

    public function delete(Cart $cart): void;
}