<?php

namespace App\Repositories;

use App\Interface\GalleryInterface;
use App\Models\Gallery;

class GalleryRepository extends BaseRepository implements GalleryInterface
{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Gallery::query();
        $query = $this->applyFilter($query, $keys, $values);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = []): ?Gallery
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Gallery::query();

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = []): ?Gallery
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Gallery::query();
        $query = $this->applyFilter($query, $keys, $values);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?Gallery
    {
        return Gallery::create($data);
    }

    public function update(Gallery $gallery, array $data): ?Gallery
    {
        $gallery->update($data);

        return $gallery;
    }

    public function delete(Gallery $gallery): void
    {
        $gallery->delete();
    }
}
