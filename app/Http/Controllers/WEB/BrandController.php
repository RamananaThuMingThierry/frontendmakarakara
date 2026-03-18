<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\BrandRequest;
use App\Services\ActivityLogService;
use App\Services\BrandService;
use Throwable;

class BrandController extends Controller
{
    public function __construct(private BrandService $brandService, private ActivityLogService $activityLogService){}

    public function index()
    {
        try{
            $constraints = [];

            $brand = $this->brandService->getAllBrands(
                array_keys($constraints),
                array_values($constraints)
            );

            return response()->json([
                'data' => $brand
            ]);
        }catch(Throwable $e){
            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_brand_failed',
                'entity_type' => 'Brand',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'brands.index',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des brands.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des brands.',
                'error' => $e->getMessage()
            ], 500);
        }

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(BrandRequest $request)
    {
        $data = $request->validated();

        try{
            $brand = $this->brandService->createBrand($data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_brand',
                'entity_type' => 'Brand',
                'entity_id' => $brand->id,
                'color' => 'success',
                'method' => 'POST',
                'route' => 'brands.store',
                'status_code' => 201,
                'message' => 'Brand créée avec succès.',
                'metadata' => [
                    "name" => $brand->name,
                    "slug" => $brand->slug,
                    "description" => $brand->description,
                    "is_active" => $brand->is_active
                ],
            ]);

            return response()->json([
                'message' => 'Brand créée avec succès.',
                'data'    => $brand
            ]);

        }catch(Throwable $e){

            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_brand_failed',
                'entity_type' => 'Brand',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'POST',
                'route' => 'brands.store',
                'status_code' => 500,
                'message' => 'Erreur lors de la création de la brand.',
                'metadata' => [
                    'payload' => $data,
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création de la brand.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'view_brand_failed',
                'entity_type' => 'Brand',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'brands.show',
                'status_code' => 400,
                'message' => 'ID de brand invalide.',
                'metadata' => [
                    'encrypted_id' => $encryptedId,
                ],
            ]);

            return response()->json(['message' => 'ID de brand invalide.'], 400);
        }

        $brand = $this->brandService->getBrandById($id, ['*']);

        if(!$brand){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'view_brand_failed',
                'entity_type' => 'Brand',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'brands.show',
                'status_code' => 404,
                'message' => 'Brand non trouvé.',
                'metadata' => [
                    'encrypted_id' => $encryptedId,
                    'decrypted_id' => $id
                ],
            ]);

            return response()->json(['message' => 'Brand non trouvé.'], 404);
        }

        return response()->json([
            'data' => $brand
        ]);
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
    public function update(BrandRequest $request, string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_brand_failed',
                'entity_type' => 'Brand',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'brands.update',
                'status_code' => 400,
                'message' => 'ID de brand invalide.',
                'metadata' => [
                    'encrypted_id' => $encryptedId,
                ],
            ]);

            return response()->json(['message' => 'ID de brand invalide.'], 400);
        }

        $brand = $this->brandService->getBrandById($id, ['id']);

        if(!$brand){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_brand_failed',
                'entity_type' => 'Brand',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'brands.update',
                'status_code' => 404,
                'message' => 'Brand non trouvé.',
                'metadata' => [
                    'encrypted_id' => $encryptedId,
                    'decrypted_id' => $id
                ],
            ]);

            return response()->json(['message' => 'Brand non trouvé.'], 404);
        }

        $data = $request->validated();

        try{

            $brand = $this->brandService->updateBrand($brand, $data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_brand',
                'entity_type' => 'Brand',
                'entity_id' => $brand->id,
                'color' => 'success',
                'method' => 'PUT',
                'route' => 'brands.update',
                'status_code' => 200,
                'message' => 'Brand mise à jour avec succès.',
                'metadata' => [
                    "name" => $brand->name,
                    "slug" => $brand->slug,
                    "description" => $brand->description,
                    "is_active" => $brand->is_active
                ],
            ]);

            return response()->json([
                'message' => 'Brand mise à jour avec succès.',
                'data'    => $brand
            ]);

        }catch(Throwable $e){

            // Log échec
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_brand_failed',
                'entity_type' => 'Brand',
                'entity_id' => $brand->id,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'brands.update',
                'status_code' => 500,
                'message' => 'Erreur lors de la mise à jour de la brand.',
                'metadata' => [
                    'payload' => $data,
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la brand.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'destroy_brand_failed',
                'entity_type' => 'Brand',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'brands.destroy',
                'status_code' => 400,
                'message' => 'ID de brand invalide.',
                'metadata' => [
                    'error' => "ID de brand invalide.",
                ],
            ]);

            return response()->json(['message' => 'ID de brand invalide.'], 400);
        }

        $brand = $this->brandService->getBrandById($id, ['*']);

        if(!$brand){

            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'destroy_brand_failed',
                'entity_type' => 'Brand',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'brands.destroy',
                'status_code' => 404,
                'message' => 'Brand non trouvé.',
                'metadata' => [
                    'error' => "Brand non trouvé.",
                ],
            ]);

            return response()->json(['message' => 'Brand non trouvé.'], 404);
        }

        try{
            $this->brandService->deleteBrand($brand);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_brand',
                'entity_type' => 'Brand',
                'entity_id' => $brand->id,
                'color' => 'success',
                'method' => 'DELETE',
                'route' => 'brands.destroy',
                'status_code' => 200,
                'message' => 'Brand supprimée avec succès.',
                'metadata' => [
                    "name" => $brand->name,
                    "slug" => $brand->slug,
                    "description" => $brand->description,
                    "is_active" => $brand->is_active
                ],
            ]);

            return response()->json([
                'message' => 'Brand supprimée avec succès.',
            ]);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_brand_failed',
                'entity_type' => 'Brand',
                'entity_id' => $brand->id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'brands.destroy',
                'status_code' => 500,
                'message' => 'Erreur lors de la suppression de la brand.',
                'metadata' => [
                    "error" => $e->getMessage()
                ],
            ]);
            return response()->json([
                'message' => 'Erreur lors de la suppression de la brand.',
                'error' => $e->getMessage()
            ], 500);
        }

    }
}
