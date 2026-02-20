<?php

namespace App\Interface;

use App\Models\Category;

interface CategoryInterface{

    public function getRootCategoriesWithTotals();

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Category;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Category;

    public function create(array $data): ?Category;

    public function update(Category $category, array $data): ?Category;

    public function delete(Category $category): void;

}
