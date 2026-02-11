<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Services\ActivityLogService;
use App\Services\CategoryService;
use Throwable;

class CategoryController extends Controller{

    public function __construct(private CategoryService $categoryService, private ActivityLogService $activityLogService){}

    public function index(){
        $categories = $this->categoryService->getAllCategories('parent_id', null, ['*'], ['children'], null);
        
        return response()->json([
            'data' => $categories
        ]);
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
                'metadata' => [
                    "name" => $category->name,
                    "slug" => $category->slug,
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
            return response()->json(['message' => 'ID de catégorie invalide.'], 400);
        }

        $category = $this->categoryService->getCategoryById($id, ['*'], ['parent', 'children']);

        if(!$category){
            return response()->json(['message' => 'Catégorie non trouvée.'], 404);
        }

        return response()->json([
            'data' => $category
        ]);
    }

    public function update(CategoryRequest $request, string $encryptedId){

        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){
            return response()->json(['message' => 'ID de catégorie invalide.'], 400);
        }

        $data = $request->validated();

        try{
            $category = $this->categoryService->getCategoryById($id, ['*']);

            if(!$category){
                return response()->json(['message' => 'Catégorie non trouvée.'], 404);
            }

            $category = $this->categoryService->updateCategory($id, $data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_category',
                'entity_type' => 'Category',
                'entity_id' => $category->id,
                'metadata' => [
                    "name" => $category->name,
                    "slug" => $category->slug,
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
            return response()->json(['message' => 'ID de catégorie invalide.'], 400);
        }

        $category = $this->categoryService->getCategoryById($id, ['*']);

        if(!$category){
            return response()->json(['message' => 'Catégorie non trouvée.'], 404);
        }

        try {
            $this->categoryService->deleteCategory($id);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_category',
                'entity_type' => 'Category',
                'entity_id' => $category->id,
                'metadata' => [
                    "name" => $category->name,
                    "slug" => $category->slug,
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
                'metadata' => [
                   'payload' => $category,
                    'error' => $e->getMessage(),
                ],    
            ]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}