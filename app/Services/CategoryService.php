<?php

namespace App\Services;

use Illuminate\Support\Str;
use App\Repositories\CategoryRepository;
use Illuminate\Validation\ValidationException;

class CategoryService{

    public function __construct(private CategoryRepository $categoryRepository){} 

    public function getAllCategories(string|array $keys, mixed $values, array $fields = ['*'], array $relations = ['children'], ?int $paginate = null)
    {
        if(array_key_exists('parent_id', $fields)){
            $keys = 'parent_id';
            $values = $fields['parent_id'];
        }
        
        return $this->categoryRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getCategoryById(int|string $id, array $fields = [], array $relations = [])
    {
        return $this->categoryRepository->getById($id, $fields, $relations);
    }

    public function getCategoryByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [])
    {
        return $this->categoryRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createCategory(array $data)
    {
        $name = trim((string)($data['name'] ?? ''));
        
        $payload = [
            'name' => $name,
            'slug' => $data['slug'] ?? Str::slug($name),
            'parent_id' => $data['parent_id'] ?? null,
        ];

        // (Optionnel) vérifie parent_id si fourni
        if (!is_null($payload['parent_id'])) {
            $parent = $this->categoryRepository->getById((int)$payload['parent_id']);
            
            if (!$parent) {
                throw ValidationException::withMessages([
                    'parent_id' => 'Le parent_id est invalide.',
                ]);
            }
        }

        $category =  $this->categoryRepository->create($payload);

        if (!$category) {
            throw ValidationException::withMessages([
                'category' => 'Création échouée.',
            ]);
        }

        return $category;
    }

    public function updateCategory(int|string $id, array $data)
    {
        $category = $this->getCategoryById($id, ['id']);

        $payload = [];

        if (array_key_exists('name', $data)) {
            $name = trim((string)$data['name']);
            if ($name === '') {
                throw ValidationException::withMessages([
                    'name' => 'Le nom ne peut pas être vide.',
                ]);
            }
            $payload['name'] = $name;

            // si slug non fourni, on peut régénérer (à toi de décider)
            if (!array_key_exists('slug', $data)) {
                $payload['slug'] = Str::slug($name);
            }
        }

        if (array_key_exists('slug', $data)) {
            $payload['slug'] = trim((string)$data['slug']);
        }

        if (array_key_exists('parent_id', $data)) {
            $parentId = $data['parent_id'];

            // accepter null pour remettre en root
            if (is_null($parentId)) {
                $payload['parent_id'] = null;
            } else {
                $parentId = (int)$parentId;

                // empêcher de se mettre soi-même comme parent
                if ($parentId === (int)$category->id) {
                    throw ValidationException::withMessages([
                        'parent_id' => 'Une catégorie ne peut pas être son propre parent.',
                    ]);
                }

                // vérifier que le parent existe
                $parent = $this->categoryRepository->getById($parentId);
                if (!$parent) {
                    throw ValidationException::withMessages([
                        'parent_id' => 'Le parent_id est invalide.',
                    ]);
                }

                $payload['parent_id'] = $parentId;
            }
        }

        $updated = $this->categoryRepository->update($category, $payload);

        if (!$updated) {
            throw ValidationException::withMessages([
                'category' => 'Mise à jour échouée.',
            ]);
        }

        return $updated;
    }

    public function deleteCategory(int|string $id): void
    {
        $category = $this->getCategoryById($id, ['id']);

        if(!$category) {
            throw ValidationException::withMessages([
                'category' => 'Catégorie non trouvée.',
            ]);
        }

        // Optionnel: empêcher suppression si elle a des enfants
        if ($category->children()->exists()) {
            throw ValidationException::withMessages([
                'category' => 'Impossible de supprimer: la catégorie contient des sous-catégories.',
            ]);
        }

        // Optionnel: empêcher suppression si elle a des produits
        if ($category->products()->exists()) {
            throw ValidationException::withMessages([
                'category' => 'Impossible de supprimer: la catégorie contient des produits.',
            ]);
        }

        $this->categoryRepository->delete($category);
    }
}