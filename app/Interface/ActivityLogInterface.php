<?php

namespace App\Interface;

use App\Models\ActivityLog;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface ActivityLogInterface
{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string $id, array $fields = ['*'], array $relations = []): ?ActivityLog;

    public function getByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = []): ?ActivityLog;

    public function create(array $data): ?ActivityLog;

    public function delete(ActivityLog $log): void;
}