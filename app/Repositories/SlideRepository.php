<?php

namespace App\Repositories;

use App\Interface\SlideInterface;
use App\Models\Slide;
use App\Repositories\BaseRepository;

class SlideRepository extends BaseRepository implements SlideInterface
{   
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Slide::query();
        $query = $this->applyFilter($query, $keys, $values);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = []): ?Slide
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Slide::query();

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = []): ?Slide
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Slide::query();
        $query = $this->applyFilter($query, $keys, $values);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?Slide
    {
        return Slide::create($data);
    }

    public function update(Slide $slide, array $data): ?Slide
    {
        $slide->update($data);
        return $slide;
    }

    public function delete(Slide $slide): void
    {
        $slide->delete();
    }
}