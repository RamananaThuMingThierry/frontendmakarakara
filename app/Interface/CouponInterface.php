<?php

namespace App\Interface;

use App\Models\Coupon;

interface CouponInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Coupon;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Coupon;

    public function create(array $data): ?Coupon;

    public function update(Coupon $coupon, array $data): ?Coupon;

    public function delete(Coupon $coupon): void;
}
