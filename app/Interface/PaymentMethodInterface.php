<?php

namespace App\Interface;

use App\Models\PaymentMethod;

interface PaymentMethodInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?PaymentMethod;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?PaymentMethod;

    public function create(array $data): ?PaymentMethod;

    public function update(PaymentMethod $paymentMethod, array $data): ?PaymentMethod;

    public function delete(PaymentMethod $paymentMethod): void;
}