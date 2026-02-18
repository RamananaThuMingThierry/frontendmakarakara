<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Services\ActivityLogService;
use App\Services\ProductService;
use Illuminate\Http\Request;
use Throwable;

class ProductController extends Controller
{
    public function __construct(private ProductService $productService, private ActivityLogService $activityLogService){}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try{
            $constraints = [];

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
    public function store(ProductRequest $request)
    {
        $data = $request->validated();

        try{

            $data['images'] = $request->file('images');

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
    public function show(string $id)
    {
        //
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
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
