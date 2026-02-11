<?php

namespace App\Services;

use App\Repositories\ActivityLogRepository;
use Illuminate\Validation\ValidationException;

class ActivityLogService{

    public function __construct(private ActivityLogRepository $activitiyLogRepository){}

    public function getAllActivityLogs(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        return $this->activitiyLogRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdActivityLog(int|string $id, array $fields = ['*'], array $relations = [])
    {
        return $this->activitiyLogRepository->getById($id, $fields, $relations);
    }

    public function getByKeysActivityLog(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [])
    {
        return $this->activitiyLogRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createActivityLog(array $data)
    {
        return $this->activitiyLogRepository->create($data);
    }

    public function deleteActivityLog(int|string $id)
    {
        $log = $this->getByIdActivityLog($id, ['id']);

        if (!$log) {
            throw ValidationException::withMessages([
                'activity_log' => 'Activity log not found.',
            ]);
        }
        
        $this->activitiyLogRepository->delete($log);
    }
}