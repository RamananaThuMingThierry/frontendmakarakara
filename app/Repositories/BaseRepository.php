<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Builder;

abstract class BaseRepository
{
    protected function withRequiredColumns(array $fields): array
    {
        if (empty($fields)) {
            return ['*'];
        }

        if ($fields !== ['*'] && !in_array('id', $fields, true)) {
            $fields[] = 'id';
        }

        return $fields;
    }

    protected function applyTrashed(
        Builder $q,
        bool $withTrashed = false,
        bool $onlyTrashed = false
    ): Builder {
        if ($onlyTrashed) {
            return $q->onlyTrashed();
        }

        if ($withTrashed) {
            return $q->withTrashed();
        }

        return $q;
    }

    protected function applyRelation(Builder $q, array $relations = []): Builder
    {
        return !empty($relations) ? $q->with($relations) : $q;
    }

    protected function applyFilter(
        Builder $q,
        string|array|null $keys,
        mixed $values
    ): Builder {

        if ($keys !== null) {
            if (is_array($keys)) {
                foreach ($keys as $idx => $key) {
                    $val = is_array($values) ? ($values[$idx] ?? null) : $values;
                    $q->where($key, $val);
                }
            } else {
                $q->where($keys, $values);
            }
        }

        return $q;
    }
}