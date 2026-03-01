<?php

namespace App\Repositories;

use App\Interface\OrderItemInterface;
use App\Models\OrderItem;

class OrderItemRepository extends BaseRepository implements OrderItemInterface
{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null) {
        $fields = $this->withRequiredColumns($fields);

        $query = OrderItem::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    /**
     * {@inheritdoc}
     */
    public function getById(int|string $id, array $fields = [], array $relations = []): ?OrderItem
    {
        $query = OrderItem::query();

        if (!empty($fields)) {
            $query->select($fields);
        }

        if (!empty($relations)) {
            $query->with($relations);
        }

        return $query->find($id);
    }

    /**
     * {@inheritdoc}
     */
    public function getByKeys(
        string|array $keys,
        mixed $values,
        array $fields = [],
        array $relations = []
    ): ?OrderItem {
        $query = OrderItem::query();

        if (!empty($fields)) {
            $query->select($fields);
        }

        if (!empty($relations)) {
            $query->with($relations);
        }

        if (is_array($keys)) {
            foreach ((array) $keys as $i => $k) {
                $query->where($k, $values[$i] ?? null);
            }
        } else {
            $query->where($keys, $values);
        }

        return $query->first();
    }

    /**
     * {@inheritdoc}
     */
    public function create(array $data): ?OrderItem
    {
        return OrderItem::create($data);
    }

    /**
     * {@inheritdoc}
     */
    public function update(OrderItem $orderItem, array $data): ?OrderItem
    {
        $orderItem->update($data);

        return $orderItem;
    }

    /**
     * {@inheritdoc}
     */
    public function delete(OrderItem $orderItem): void
    {
        $orderItem->delete();
    }
}