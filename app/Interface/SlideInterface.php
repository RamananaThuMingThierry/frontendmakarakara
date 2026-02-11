<?php

namespace App\Interface;

use App\Models\Slide;

interface SlideInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null);

    public function getById(int|string $id, array $fields = []): ?Slide;

    public function getByKeys(string|array $keys, mixed $values, array $fields = []): ?Slide;

    public function create(array $data): ?Slide;

    public function update(Slide $slide, array $data): ?Slide;

    public function delete(Slide $slide): void;
}