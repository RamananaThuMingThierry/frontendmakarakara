<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductImageRequest;
use App\Services\ActivityLogService;
use App\Services\ProductImageService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Throwable;

class ProductImageController extends Controller
{
    public function __construct(private ProductImageService $productImageService, private ActivityLogService $activityLogService){}

    public function index()
    {
        try{
            $constraint = [];

            $productImages = $this->productImageService->getAllProductImages(
                keys: array_keys($constraint),
                values: array_values($constraint),
                fields: ['*'],
            );

            return response()->json([
                'data' => $productImages
            ]);

        }catch(Throwable $e){
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_product_image_failed',
                'entity_type' => 'ProductImage',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des images de produits',
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

    public function store(ProductImageRequest $request)
    {
        $data = $request->validated();

        try {
            $productImages = $this->productImageService->createProductImage($data);

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_product_images',
                'entity_type' => 'ProductImage',
                'entity_id' => null,
                'color' => 'success',
                'route' => 'admin.product_images.store',
                'status_code' => 201,
                'method' => 'POST',
                'message' => 'Images ajoutées avec succès.',
                'metadata' => [
                    'product_id' => $data['product_id'],
                    'count' => count($productImages),
                ],
            ]);

            return response()->json([
                'message' => 'Images ajoutées avec succès.',
                'data' => $productImages,
            ], 201);

        } catch(ValidationException $e){

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_product_image_failed',
                'entity_type' => 'ProductImage',
                'entity_id' => null,
                'color' => 'danger',
                'route' => 'admin.product_images.store',
                'status_code' => 422,
                'method' => 'POST',
                'message' => 'Données invalides.',
                'metadata' => [
                    'error' => $e->errors(),
                ],
            ]);

            return response()->json([
                'message' => 'Données invalides.',
                'errors' => $e->errors(),
            ], 422);
            
        } catch (Throwable $e) {

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_product_image_failed',
                'entity_type' => 'ProductImage',
                'entity_id' => null,
                'color' => 'danger',
                'route' => 'admin.product_images.store',
                'status_code' => 500,
                'method' => 'POST',
                'message' => 'Erreur lors de la création des images.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création des images.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(string $encryptedId)
    {
        try {

            $id = decrypt_to_int_or_null($encryptedId);

            if (is_null($id)) {
                $this->activityLogService->createActivityLog([
                    'user_id' => Auth::id(),
                    'action' => 'delete_product_image_failed',
                    'entity_type' => 'ProductImage',
                    'entity_id' => null,
                    'color' => 'danger',
                    'method' => 'DELETE',
                    'route' => 'admin.product_images.destroy',
                    'status_code' => 400,
                    'message' => 'ID de l\'image invalide.',
                    'metadata' => [
                        'error' => "ID invalide: $encryptedId",
                    ],
                ]);

                return response()->json([
                    'message' => 'ID de l\'image invalide.'
                ], 400);
            }

            $productImage = $this->productImageService->getProductImageById($id, ['url']);

            if (!$productImage) {
                $this->activityLogService->createActivityLog([
                    'user_id' => Auth::id(),
                    'action' => 'delete_product_image_failed',
                    'entity_type' => 'ProductImage',
                    'entity_id' => $id,
                    'color' => 'warning',
                    'method' => 'DELETE',
                    'route' => 'admin.product_images.destroy',
                    'status_code' => 404,
                    'message' => 'Image non trouvé.',
                    'metadata' => [
                        'error' => "ID de l'image non trouvé : $id",
                    ],
                ]);

                return response()->json([
                    'message' => 'Image non trouvé.'
                ], 404);
            }

            $this->productImageService->deleteProductImage($productImage);

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_product_image',
                'entity_type' => 'ProductImage',
                'entity_id' => $productImage->id,
                'color' => 'danger',
                'route' => 'admin.product_images.destroy',
                'status_code' => 200,
                'method' => 'DELETE',
                'message' => 'Image supprimée avec succès.',
                'metadata' => [
                    'product_id' => $productImage->product_id,
                    'url' => $productImage->url,
                ],
            ]);

            return response()->json([
                'message' => 'Image supprimée avec succès.'
            ], 200);

        } catch (Throwable $e) {

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_product_image_failed',
                'entity_type' => 'ProductImage',
                'entity_id' => null,
                'color' => 'danger',
                'route' => 'admin.product_images.destroy',
                'status_code' => 500,
                'method' => 'DELETE',
                'message' => 'Erreur lors de la suppression de l’image.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la suppression.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
