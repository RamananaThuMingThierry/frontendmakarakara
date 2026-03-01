<?php

namespace App\Interface;

use App\Models\Order;

interface OrderInterface
{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Order;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Order;

    public function create(array $data): ?Order;

    public function update(Order $order, array $data): ?Order;

    public function delete(Order $order): void;
}
