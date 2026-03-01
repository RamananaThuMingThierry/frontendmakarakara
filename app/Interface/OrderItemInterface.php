<?php

namespace App\Interface;

use App\Models\OrderItem;

interface OrderItemInterface
{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?OrderItem;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?OrderItem;

    public function create(array $data): ?OrderItem;

    public function update(OrderItem $orderItem, array $data): ?OrderItem;

    public function delete(OrderItem $orderItem): void;
}
