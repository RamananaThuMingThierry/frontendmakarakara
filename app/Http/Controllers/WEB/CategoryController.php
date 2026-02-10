<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Services\CategoryService;

class CategoryController extends Controller{

    public function __construct(private CategoryService $categoryService){}

    public function index(){
        $categories = $this->categoryService->getAllCategories('parent_id', null, ['*'], ['children'], null);
        
        return response()->json([
            'data' => $categories
        ]);
    }

    public function store(CategoryRequest $request){
        $data = $request->validated();

        $category = $this->categoryService->createCategory($data);

        return response()->json([
            'message' => 'Catégorie créée avec succès.',
            'data' => $category
        ], 201);
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

        $category = $this->categoryService->updateCategory($id, $data);

        if(!$category){
            return response()->json(['message' => 'Catégorie non trouvée.'], 404);
        }

        return response()->json([
            'message' => 'Catégorie mise à jour avec succès.',
            'data' => $category
        ]);
    }

    public function destroy(string $encryptedId){
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){
            return response()->json(['message' => 'ID de catégorie invalide.'], 400);
        }

        try {
            $this->categoryService->deleteCategory($id);
            return response()->json(['message' => 'Catégorie supprimée avec succès.']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}