<?php

namespace App\Repositories;

use App\Interface\CategoryInterface;
use App\Models\Category;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class CategoryRepository extends BaseRepository implements CategoryInterface
{   

    public function getRootCategoriesWithTotals()
    {
        $sql = "
            WITH RECURSIVE tree AS (
                SELECT id AS root_id, id AS node_id
                FROM categories
                WHERE parent_id IS NULL

                UNION ALL

                SELECT tree.root_id, c.id
                FROM categories c
                JOIN tree ON tree.node_id = c.parent_id
            )

            SELECT
                cat.*,
                COUNT(DISTINCT CASE 
                    WHEN tree.node_id != tree.root_id 
                    THEN tree.node_id 
                END) AS subcategories_total,

                COUNT(DISTINCT p.id) AS products_total

            FROM categories cat
            LEFT JOIN tree ON tree.root_id = cat.id
            LEFT JOIN products p ON p.category_id = tree.node_id

            WHERE cat.parent_id IS NULL
            GROUP BY cat.id
        ";

        $rows = collect(DB::select($sql));

        return $rows->map(function ($row) {
            $row->encrypted_id = Crypt::encryptString((string)$row->id); 
            return $row;
        });
    }

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Category::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = [], array $relations = []): ?Category
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Category::query();
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = []): ?Category
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Category::query();
        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?Category
    {
        return Category::create($data);
    }

    public function update(Category $category, array $data): ?Category
    {
        $category->update($data);
        return $category;
    }

    public function delete(Category $category): void
    {
        $category->delete();
    }
}