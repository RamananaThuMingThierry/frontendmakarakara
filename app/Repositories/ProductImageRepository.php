<?php

namespace App\Repositories;

use App\Interface\ProductImageInterface;
use App\Models\ProductImage;
use App\Repositories\BaseRepository;

class ProductImageRepository extends BaseRepository implements ProductImageInterface
{   
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['position' => 'asc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ProductImage::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);
        $query = $query->orderBy(key($orderBy), current($orderBy));

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?ProductImage
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ProductImage::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?ProductImage
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ProductImage::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?ProductImage
    {
        return ProductImage::create($data);
    }

    public function update(ProductImage $productImage, array $data): ?ProductImage
    {
        $productImage->update($data);
        return $productImage;
    }

    public function delete(ProductImage $productImage): void
    {
        $productImage->delete();
    }

    public function reorderPositions(int $productId): void
    {
        $images = ProductImage::where('product_id', $productId)
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        foreach ($images as $i => $image) {
            $image->position = $i;
        }

        ProductImage::upsert(
            $images->toArray(),
            ['id'],
            ['position']
        );
    }

}