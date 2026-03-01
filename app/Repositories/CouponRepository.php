<?php

namespace App\Repositories;

use App\Interface\CouponInterface;
use App\Models\Coupon;

class CouponRepository extends BaseRepository implements CouponInterface
{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Coupon::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Coupon
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Coupon::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Coupon
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Coupon::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?Coupon
    {
        return Coupon::create($data);
    }

    public function update(Coupon $coupon, array $data): ?Coupon
    {
        $coupon->update($data);
        return $coupon;
    }

    public function delete(Coupon $coupon): void
    {
        $coupon->delete();
    }
}
