<?php

namespace App\Interface;

use App\Models\Gallery;

interface GalleryInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null);

    public function getById(int|string $id, array $fields = []): ?Gallery;

    public function getByKeys(string|array $keys, mixed $values, array $fields = []): ?Gallery;

    public function create(array $data): ?Gallery;

    public function update(Gallery $gallery, array $data): ?Gallery;

    public function delete(Gallery $gallery): void;
}
