<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use App\Services\ProductImageService;
use Throwable;

class ProductImageController extends Controller
{
    public function __construct(private ProductImageService $productImageService, private ActivityLogService $activityLogService){}

    public function index()
    {
        try{
        
            $constraint = [
                'product_id' => 8,
            ];

            $productImages = $this->productImageService->getAllProductImages(
                keys: array_keys($constraint),
                values: array_values($constraint),
                fields: ['*'],
                relations: ['product'],
            );

            return response()->json([
                'data' => $productImages
            ]);

        }catch(Throwable $e){
            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_product_image_failed',
                'entity_type' => 'ProductImage',
                'entity_id' => null,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des images de produits.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
