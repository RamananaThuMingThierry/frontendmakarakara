<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Services\ActivityLogService;
use App\Services\CategoryService;
use Throwable;

class CategoryController extends Controller{

    public function __construct(private CategoryService $categoryService, private ActivityLogService $activityLogService){}

    public function index()
    {
        try{
            $categories = $this->categoryService->getRootListForIndex();

            return response()->json([
                'data' => $categories
            ]);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_categories_failed',
                'entity_type' => 'Category',
                'entity_id' => null,
                'level' => 'danger',
                'method' => 'GET',
                'route' => 'admin.categories.index',
                'status_code' => 500,
                'message' => 'Erreur lors de la récupération des catégories.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la récupération des catégories.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(CategoryRequest $request){

        $data = $request->validated();

        try{
            $category = $this->categoryService->createCategory($data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_category',
                'entity_type' => 'Category',
                'entity_id' => $category->id,
                'level' => 'success',
                'method' => 'POST',
                'route' => 'admin.categories.store',
                'status_code' => 201,
                'message' => 'Catégorie créée avec succès.',
                'metadata' => [
                    "name" => $category->name,
                    "slug" => $category->slug,
                    "is_active" => $category->is_active,
                    "parent_id" => $category->parent_id
                ],
            ]);

            return response()->json([
                'message' => 'Catégorie créée avec succès.',
                'data' => $category
            ], 201);
        }catch(Throwable $e){

            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_category_failed',
                'entity_type' => 'Category',
                'entity_id' => null,
                'level' => 'danger',
                'method' => 'POST',
                'route' => 'admin.categories.store',
                'status_code' => 500,
                'message' => 'Erreur lors de la création de la catégorie.',
                'metadata' => [
                    'payload' => $data,
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création de la catégorie.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $encryptedId){

        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_category_failed',
                'entity_type' => 'Category',
                'entity_id' => null,
                'level' => 'danger',
                'method' => 'GET',
                'route' => 'admin.categories.show',
                'status_code' => 400,
                'message' => 'ID de catégorie invalide.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ],
            ]);

            return response()->json(['message' => 'ID de catégorie invalide.'], 400);
        }

        $category = $this->categoryService->getCategoryTreeWithProducts($id);

        if(!$category){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_category_failed',
                'entity_type' => 'Category',
                'entity_id' => $id,
                'level' => 'danger',
                'method' => 'GET',
                'route' => 'admin.categories.show',
                'status_code' => 404,
                'message' => 'Catégorie non trouvée.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ],    
            ]);

            return response()->json(['message' => 'Catégorie non trouvée.'], 404);
        }

        return response()->json([
            'data' => $category
        ]);
    }

    public function update(CategoryRequest $request, string $encryptedId){

        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_category_failed',
                'entity_type' => 'Category',
                'entity_id' => null,
                'level' => 'danger',
                'method' => 'PUT',
                'route' => 'admin.categories.update',
                'status_code' => 400,
                'message' => 'ID de catégorie invalide.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ],
            ]);

            return response()->json(['message' => 'ID de catégorie invalide.'], 400);
        }

        $data = $request->validated();

        try{
            $category = $this->categoryService->getCategoryById($id, ['*']);

            if(!$category){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'update_category_failed',
                    'entity_type' => 'Category',
                    'entity_id' => $id,
                    'level' => 'danger',
                    'method' => 'PUT',
                    'route' => 'admin.categories.update',
                    'status_code' => 404,
                    'message' => 'Catégorie non trouvée.',
                    'metadata' => [
                        'encrypted_id' => $encryptedId
                    ],    
                ]);

                return response()->json(['message' => 'Catégorie non trouvée.'], 404);
            }

            $category = $this->categoryService->updateCategory($category, $data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_category',
                'entity_type' => 'Category',
                'entity_id' => $category->id,
                'level' => 'success',
                'method' => 'PUT',
                'route' => 'admin.categories.update',
                'status_code' => 200,
                'message' => 'Catégorie mise à jour avec succès.',
                'metadata' => [
                    "name" => $category->name,
                    "slug" => $category->slug,
                    "is_active" => $category->is_active,
                    "parent_id" => $category->parent_id
                ],
            ]);

            return response()->json([
                'message' => 'Catégorie mise à jour avec succès.',
                'data' => $category
            ]);
        }catch(Throwable $e){
            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_category_failed',
                'entity_type' => 'Category',
                'entity_id' => null,
                'level' => 'danger',
                'method' => 'PUT',
                'route' => 'admin.categories.update',
                'status_code' => 500,
                'message' => 'Erreur lors de la mise à jours de la catégorie.',
                'metadata' => [
                    'payload' => $data,
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la mise à jours de la catégorie.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $encryptedId){

        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'destroy_category_failed',
                'entity_type' => 'Category',
                'entity_id' => null,
                'level' => 'danger',    
                'method' => 'DELETE',
                'route' => 'admin.categories.destroy',
                'status_code' => 400,
                'message' => 'ID de catégorie invalide.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ]    
            ]);

            return response()->json(['message' => 'ID de catégorie invalide.'], 400);
        }

        $category = $this->categoryService->getCategoryById($id, ['*']);

        if(!$category){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'destroy_category_failed',
                'entity_type' => 'Category',
                'entity_id' => $id,
                'level' => 'danger',    
                'method' => 'DELETE',
                'route' => 'admin.categories.destroy',
                'status_code' => 404,
                'message' => 'Catégorie non trouvée.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ]
            ]);

            return response()->json(['message' => 'Catégorie non trouvée.'], 404);
        }

        try {

            $this->categoryService->deleteCategory($category);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_category',
                'entity_type' => 'Category',
                'entity_id' => $category->id,
                'level' => 'success',
                'method' => 'DELETE',
                'route' => 'admin.categories.destroy',
                'status_code' => 200,
                'message' => 'Catégorie supprimée avec succès.',
                'metadata' => [
                    "name" => $category->name,
                    "slug" => $category->slug,
                    "is_active" => $category->is_active,
                    "parent_id" => $category->parent_id
                ],
            ]);

            return response()->json(['message' => 'Catégorie supprimée avec succès.']);

        } catch (\Exception $e) {

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_category_failed',
                'entity_type' => 'Category',
                'entity_id' => $category->id,
                'level' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.categories.destroy',
                'status_code' => 500,
                'message' => 'Erreur lors de la suppression de la catégorie.',
                'metadata' => [
                   'payload' => $category,
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
