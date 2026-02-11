<?php

namespace App\Repositories;

use App\Repositories\BaseRepository;
use App\Interface\ActivityLogInterface;
use App\Models\ActivityLog;

class ActivityLogRepository extends BaseRepository implements ActivityLogInterface
{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ActivityLog::query()->select($fields);

        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);
        $query = $query->orderBy(key($orderBy), current($orderBy));

        return $paginate ? $query->paginate($paginate) : $query->get();
    }

    public function getById(int|string $id, array $fields = ['*'], array $relations = []): ?ActivityLog
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ActivityLog::query()->select($fields);
        $query = $this->applyRelation($query, $relations);

        return $query->findOrFail($id);
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = []): ?ActivityLog
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ActivityLog::query()->select($fields);
        $query = $this->applyRelation($query, $relations);
        $query = $this->applyFilter($query, $keys, $values);

        return $query->first();
    }

    public function create(array $data): ?ActivityLog
    {
        return ActivityLog::create($data);
    }

    public function delete(ActivityLog $log): void
    {
        $log->delete();
    }
}