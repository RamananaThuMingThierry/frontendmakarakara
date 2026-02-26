<?php

namespace App\Repositories;

use App\Interface\ReviewInterface;
use App\Models\Review;
use App\Repositories\BaseRepository;

class ReviewRepository extends BaseRepository implements ReviewInterface
{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Review::query();
        $query = $this->applyFilter($query, $keys, $values);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = []): ?Review
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Review::query();

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = []): ?Review
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Review::query();
        $query = $this->applyFilter($query, $keys, $values);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?Review
    {
        return Review::create($data);
    }

    public function update(Review $review, array $data): ?Review
    {
        $review->update($data);
        return $review;
    }

    public function delete(Review $review): void
    {
        $review->delete();
    }
}
