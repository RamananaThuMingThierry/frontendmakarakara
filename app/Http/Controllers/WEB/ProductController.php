<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Models\Product;
use App\Services\ActivityLogService;
use App\Services\ProductService;
use Throwable;

class ProductController extends Controller
{
    public function __construct(private ProductService $productService, private ActivityLogService $activityLogService){}

    public function shopShow(string $encryptedId)
    {
        try {
            $productId = decrypt_to_int_or_null($encryptedId);

            if (is_null($productId)) {
                return response()->json(['message' => 'ID de produit invalide.'], 400);
            }

            $product = Product::query()
                ->with([
                    'category',
                    'brand',
                    'images',
                    'inventories' => function ($query) {
                        $query->with('city')
                            ->whereNotNull('city_id')
                            ->where('is_available', true)
                            ->whereHas('city', function ($cityQuery) {
                                $cityQuery->where('is_active', true);
                            });
                    },
                ])
                ->where('id', $productId)
                ->where('is_active', true)
                ->whereHas('inventories', function ($query) {
                    $query->whereNotNull('city_id')
                        ->where('is_available', true)
                        ->whereHas('city', function ($cityQuery) {
                            $cityQuery->where('is_active', true);
                        });
                })
                ->first();

            if (!$product) {
                return response()->json(['message' => 'Produit non trouvé.'], 404);
            }

            return response()->json(['data' => $product], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération du produit.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display a listing of the resource.
     */
    public function index(?string $categoryEncryptedId = null)
    {
        try{
            $categoryId = decrypt_to_int_or_null($categoryEncryptedId);

            if(is_null($categoryId)){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'index_product_failed',
                    'entity_type' => 'Product',
                    'entity_id' => null,
                    'color' => 'danger',
                    'method' => 'GET',
                    'route' => 'admin.categories.products.index',
                    'status_code' => 500,
                    'message' => 'ID de la catégorie invalide.',
                    'metadata' => [
                        'encrypted_id' => $categoryEncryptedId
                    ],
                ]);

                return response()->json(['message' => 'ID de catégorie invalide.'], 400);
            }

            $constraints['category_id'] = $categoryId;

            $products = $this->productService->getAllProducts(
                keys: array_keys($constraints),
                values: array_values($constraints),
                relations: ['images']
            );

            return response()->json([
                'data' => $products
            ]);

        }catch(Throwable $e){

            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_product_failed',
                'entity_type' => 'Product',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.categories.products.index',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des produits.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des produits.',
                'error' => $e->getMessage()
            ], 500);
        }

    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ProductRequest $request, ?string $categoryEncryptedId = null)
    {

        $data = $request->validated();

        try{
            $categoryId = decrypt_to_int_or_null($categoryEncryptedId);

            if(is_null($categoryId)){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'index_product_failed',
                    'entity_type' => 'Product',
                    'entity_id' => null,
                    'color' => 'danger',
                    'method' => 'GET',
                    'route' => 'admin.categories.products.store',
                    'status_code' => 500,
                    'message' => 'ID de la catégorie invalide.',
                    'metadata' => [
                        'encrypted_id' => $categoryEncryptedId
                    ],
                ]);

                return response()->json(['message' => 'ID de catégorie invalide.'], 400);
            }else{
                $data['category_id'] = (int) $categoryId;
            }

            $data['images'] = $request->file('images', []);

            $product = $this->productService->createProduct($data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_product',
                'entity_type' => 'Product',
                'entity_id' => $product->id,
                'metadata' => [
                    "name" => $product->name,
                    "slug" => $product->slug,
                    "is_active" => $product->is_active,
                    "price" => $product->price,
                    "sku" => $product->sku,
                    "barcode" => $product->barcode,
                ],
            ]);

            return response()->json([
                'message' => 'Produit créée avec succès.',
                'data' => $product->load('images')
            ], 201);

        }catch(Throwable $e){
            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_procut_failed',
                'entity_type' => 'Product',
                'entity_id' => null,
                'method' => 'POST',
                'route' => 'admin.categories.products.store',
                'status_code' => 500,
                'message' => 'Erreur lors de la création du produit.',
                'metadata' => [
                    'payload' => $data,
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création du produit.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

/**
 * Display the specified resource.
 */
public function show(?string $categoryEncryptedId = null, string $encryptedId)
{
    try {
        $categoryId = decrypt_to_int_or_null($categoryEncryptedId);
        $productId  = decrypt_to_int_or_null($encryptedId);

        // Si route avec catégorie, on valide son id (mais on accepte null si route sans catégorie)
        if (!is_null($categoryEncryptedId) && is_null($categoryId)) {
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_product_failed',
                'entity_type' => 'Product',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.categories.products.show',
                'status_code' => 400,
                'message' => 'ID de la catégorie invalide.',
                'metadata' => [
                    'encrypted_category_id' => $categoryEncryptedId,
                ],
            ]);

            return response()->json(['message' => 'ID de catégorie invalide.'], 400);
        }

        if (is_null($productId)) {
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_product_failed',
                'entity_type' => 'Product',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.categories.products.show',
                'status_code' => 400,
                'message' => 'ID de produit invalide.',
                'metadata' => [
                    'encrypted_product_id' => $encryptedId,
                ],
            ]);

            return response()->json(['message' => 'ID de produit invalide.'], 400);
        }

        $product = $this->productService->getProductById(
            $productId,
            ['*'],
            ['category', 'brand', 'images', 'inventories.city', 'stockMouvements.cityFrom:id,name', 'stockMouvements.cityTo:id,name', 'stockMouvements.user:id,name']
        );

        if (!$product) {
            return response()->json(['message' => 'Produit non trouvé.'], 404);
        }

        // Si catégorie présente dans la route, on vérifie que le produit appartient bien à cette catégorie
        if (!is_null($categoryId) && (int) $product->category_id !== (int) $categoryId) {
            return response()->json([
                'message' => 'Produit non trouvé dans cette catégorie.'
            ], 404);
        }

        return response()->json(['data' => $product], 200);

    } catch (Throwable $e) {
        $this->activityLogService->createActivityLog([
            'user_id' => auth()->id(),
            'action' => 'show_product_failed',
            'entity_type' => 'Product',
            'entity_id' => null,
            'metadata' => [
                'error' => $e->getMessage(),
                'encrypted_category_id' => $categoryEncryptedId,
                'encrypted_product_id' => $encryptedId,
            ],
        ]);

        return response()->json([
            'message' => 'Erreur lors de la récupération du produit.',
            'error' => $e->getMessage(),
        ], 500);
    }
}

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

/**
 * Update the specified resource in storage.
 */
public function update(ProductRequest $request, ?string $categoryEncryptedId = null, string $encryptedId)
{
    $data = $request->validated();

    try {
        $categoryId = decrypt_to_int_or_null($categoryEncryptedId);
        $productId  = decrypt_to_int_or_null($encryptedId);

        // catégorie invalide (si param fourni)
        if (!is_null($categoryEncryptedId) && is_null($categoryId)) {
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_product_failed',
                'entity_type' => 'Product',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'admin.categories.products.update',
                'status_code' => 400,
                'message' => 'ID de la catégorie invalide.',
                'metadata' => [
                    'encrypted_category_id' => $categoryEncryptedId
                ],
            ]);

            return response()->json(['message' => 'ID de catégorie invalide.'], 400);
        }

        if (is_null($productId)) {
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_product_failed',
                'entity_type' => 'Product',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'admin.categories.products.update',
                'status_code' => 400,
                'message' => 'ID de produit invalide.',
                'metadata' => [
                    'encrypted_product_id' => $encryptedId
                ],
            ]);

            return response()->json(['message' => 'ID de produit invalide.'], 400);
        }

        // récupérer produit pour vérifier qu'il appartient à la catégorie (si route imbriquée)
        $product = $this->productService->getProductById($productId, ['*']);
        if (!$product) {
            return response()->json(['message' => 'Produit non trouvé.'], 404);
        }

        if (!is_null($categoryId) && (int) $product->category_id !== (int) $categoryId) {
            return response()->json(['message' => 'Produit non trouvé dans cette catégorie.'], 404);
        }

        // fichiers images (optionnel)
        $data['images'] = $request->file('images', $data['images'] ?? []);

        // deleted_image_ids (optionnel)
        // peut venir en JSON string depuis FormData => on normalise
        if ($request->has('deleted_image_ids')) {
            $deleted = $request->input('deleted_image_ids');

            if (is_string($deleted)) {
                $decoded = json_decode($deleted, true);
                $data['deleted_image_ids'] = is_array($decoded) ? $decoded : [];
            } elseif (is_array($deleted)) {
                $data['deleted_image_ids'] = $deleted;
            } else {
                $data['deleted_image_ids'] = [];
            }
        }

        $updated = $this->productService->updateProduct($productId, $data);

        // recharger relations pour retour propre
        $fresh = $this->productService->getProductById(
            $productId,
            ['*'],
            ['category', 'brand', 'images', 'inventories.city', 'stockMouvements.cityFrom:id,name', 'stockMouvements.cityTo:id,name', 'stockMouvements.user:id,name']
        );

        $this->activityLogService->createActivityLog([
            'user_id' => auth()->id(),
            'action' => 'update_product',
            'entity_type' => 'Product',
            'entity_id' => $productId,
            'metadata' => [
                'name' => $fresh?->name,
                'slug' => $fresh?->slug,
                'is_active' => $fresh?->is_active,
                'price' => $fresh?->price,
                'sku' => $fresh?->sku,
                'barcode' => $fresh?->barcode,
            ],
        ]);

        return response()->json([
            'message' => 'Produit modifié avec succès.',
            'data' => $fresh ?? $updated
        ], 200);

    } catch (Throwable $e) {

        $this->activityLogService->createActivityLog([
            'user_id' => auth()->id(),
            'action' => 'update_product_failed',
            'entity_type' => 'Product',
            'entity_id' => null,
            'color' => 'danger',
            'method' => 'PUT',
            'route' => 'admin.categories.products.update',
            'status_code' => 500,
            'message' => 'Erreur lors de la mise à jour du produit.',
            'metadata' => [
                'payload' => $data,
                'encrypted_category_id' => $categoryEncryptedId,
                'encrypted_product_id' => $encryptedId,
                'error' => $e->getMessage(),
            ],
        ]);

        return response()->json([
            'message' => 'Erreur lors de la mise à jour du produit.',
            'error' => $e->getMessage()
        ], 500);
    }
}

/**
 * Remove the specified resource from storage.
 */
public function destroy(?string $categoryEncryptedId = null, string $encryptedId)
{
    try {
        $categoryId = decrypt_to_int_or_null($categoryEncryptedId);
        $productId  = decrypt_to_int_or_null($encryptedId);

        // catégorie invalide (si param fourni)
        if (!is_null($categoryEncryptedId) && is_null($categoryId)) {
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_product_failed',
                'entity_type' => 'Product',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.categories.products.destroy',
                'status_code' => 400,
                'message' => 'ID de la catégorie invalide.',
                'metadata' => [
                    'encrypted_category_id' => $categoryEncryptedId
                ],
            ]);

            return response()->json(['message' => 'ID de catégorie invalide.'], 400);
        }

        if (is_null($productId)) {
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_product_failed',
                'entity_type' => 'Product',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.categories.products.destroy',
                'status_code' => 400,
                'message' => 'ID de produit invalide.',
                'metadata' => [
                    'encrypted_product_id' => $encryptedId
                ],
            ]);

            return response()->json(['message' => 'ID de produit invalide.'], 400);
        }

        $product = $this->productService->getProductById(
            $productId,
            ['*'],
            ['images'] // utile si tu veux gérer suppression fichiers plus tard
        );

        if (!$product) {
            return response()->json(['message' => 'Produit non trouvé.'], 404);
        }

        // Vérifier appartenance à la catégorie si route imbriquée
        if (!is_null($categoryId) && (int) $product->category_id !== (int) $categoryId) {
            return response()->json(['message' => 'Produit non trouvé dans cette catégorie.'], 404);
        }

        $this->productService->deleteProduct($product);

        $this->activityLogService->createActivityLog([
            'user_id' => auth()->id(),
            'action' => 'delete_product',
            'entity_type' => 'Product',
            'entity_id' => $productId,
            'metadata' => [
                'name' => $product->name,
                'sku' => $product->sku,
                'category_id' => $product->category_id,
            ],
        ]);

        return response()->json([
            'message' => 'Produit supprimé avec succès.'
        ], 200);

    } catch (Throwable $e) {

        $this->activityLogService->createActivityLog([
            'user_id' => auth()->id(),
            'action' => 'delete_product_failed',
            'entity_type' => 'Product',
            'entity_id' => null,
            'color' => 'danger',
            'method' => 'DELETE',
            'route' => 'admin.categories.products.destroy',
            'status_code' => 500,
            'message' => 'Erreur lors de la suppression du produit.',
            'metadata' => [
                'encrypted_category_id' => $categoryEncryptedId,
                'encrypted_product_id' => $encryptedId,
                'error' => $e->getMessage(),
            ],
        ]);

        return response()->json([
            'message' => 'Erreur lors de la suppression du produit.',
            'error' => $e->getMessage()
        ], 500);
    }
}
}
