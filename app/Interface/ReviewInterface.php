<?php

namespace App\Interface;

use App\Models\Review;

interface ReviewInterface{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Review;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Review;

    public function create(array $data): ?Review;

    public function update(Review $review, array $data): ?Review;

    public function delete(Review $review): void;
}
