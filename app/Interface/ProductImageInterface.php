<?php

namespace App\Interface;

use App\Models\ProductImage;

interface ProductImageInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null);

    public function getById(int|string $id, array $fields = [], array $relations = []): ?ProductImage;

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?ProductImage;
    
    public function create(array $data): ?ProductImage;

    public function update(ProductImage $productImage, array $data): ?ProductImage;

    public function delete(ProductImage $productImage): void;
}