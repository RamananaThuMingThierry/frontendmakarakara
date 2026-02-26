<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddressRequest;
use App\Services\ActivityLogService;
use App\Services\AddressService;
use Throwable;

class AddressController extends Controller
{
    public function __construct(private AddressService $addressService, private ActivityLogService $activityLogService){}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try{

            $constraints = [];

            $addresses = $this->addressService->getAllAddresses(
                keys: array_keys($constraints),
                values: array_values($constraints),
                fields: ['*'],
                relations: []
            );

            return response()->json([
                'data' => $addresses,
            ], 200);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_address_failed',
                'color' => 'danger',
                'entity_type' => 'Address',
                'entity_id' => null,
                'method' => 'GET',
                'route' => 'addresses.index',
                'message' => 'Erreur lors du chargement des adresses.',
                'status_code' => 500,
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
    public function store(AddressRequest $request)
    {
        $data = $request->validated();

        try{
            $address = $this->addressService->createAddress($data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_address',
                'entity_type' => 'Address',
                'entity_id' => $address->id,
                'color' => 'success',
                'method' => 'POST',
                'route' => 'addresses.store',
                'message' => 'Adresse créée avec succès.',
                'status_code' => 201,
                'metadata' => [
                    "name" => $address->name,
                    "region" => $address->region,
                    "is_active" => $address->is_active
                ],
            ]);

            return response()->json([
                'message' => 'Adresse créée avec succès.',
                'data'    => $address
            ], 201);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_address_failed',
                'entity_type' => 'Address',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'POST',
                'route' => 'addresses.store',
                'message' => 'Échec de la création de l\'adresse.',
                'status_code' => 500,
                'metadata' => [
                    "error" => $e->getMessage()
                ],
            ]);

            return response()->json([
                'message' => 'Échec de la création de l\'adresse. '.$e->getMessage()
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
                'action' => 'view_address_failed',
                'entity_type' => 'Address',
                'color' => 'warning',
                'method' => 'GET',
                'route' => 'addresses.show',
                'message' => 'ID de l\'adresse invalide.',
                'status_code' => 400,
                'metadata' => [
                    'error' => 'ID invalide',
                ],
            ]);
            return response()->json(['message' => 'ID de l\'adresse invalide.'], 400);
        }

        try{
            $address = $this->addressService->getAddressById($id, ['*']);

            if(!$address){
                return response()->json([
                    'message' => 'Adresse non trouvée.'
                ], 404);
            }

            return response()->json([
                'data' => $address,
            ], 200);

        }catch(Throwable $e){
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_address_failed',
                'entity_type' => 'Address',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'addresses.show',
                'message' => 'Erreur lors du chargement de l\'adresse.',
                'status_code' => 500,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement de l\'adresse.',
                'error' => $e->getMessage()
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
    public function update(AddressRequest $request, string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_address_failed',
                'entity_type' => 'Address',
                'color' => 'warning',
                'method' => 'PUT',
                'route' => 'addresses.update',
                'message' => 'ID de l\'adresse invalide.',
                'status_code' => 400,
                'metadata' => [
                    'error' => 'ID invalide',
                ],
            ]);
            return response()->json(['message' => 'ID de l\'adresse invalide.'], 400);
        }

        try{
            $data = $request->validated();

            $address = $this->addressService->getAddressById($id, ['*']);

            if(!$address){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'update_address_failed',
                    'entity_type' => 'Address',
                    'entity_id' => $id,
                    'color' => 'warning',
                    'method' => 'PUT',
                    'route' => 'addresses.update',
                    'message' => 'Adresse non trouvée.',
                    'status_code' => 404,
                    'metadata' => [
                        'error' => 'Adresse non trouvée.'
                    ],
                ]);

                return response()->json([
                    'message' => 'Adresse non trouvée.'
                ], 404);
            }

            $address = $this->addressService->updateAddress($address, $data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_address',
                'entity_type' => 'Address',
                'entity_id' => $id,
                'color' => 'primary',
                'method' => 'PUT',
                'route' => 'addresses.update',
                'message' => 'Adresse mise à jour avec succès.',
                'status_code' => 200 
            ]);

            return response()->json([
                'message' => 'Adresse mise à jour avec succès.',
                'data'    => $address
            ], 200);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_address_failed',
                'entity_type' => 'Address',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'addresses.update',
                'message' => 'Erreur lors de la mise à jour de l\'adresse.',
                'status_code' => 500,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
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
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_address_failed',
                'entity_type' => 'Address',
                'color' => 'warning',
                'method' => 'DELETE',
                'route' => 'addresses.destroy',
                'message' => 'ID de l\'adresse invalide.',
                'status_code' => 400,
                'metadata' => [
                    'error' => 'ID invalide',
                ],
            ]);
            return response()->json(['message' => 'ID de l\'adresse invalide.'], 400);
        }

        try{
            $deleted = $this->addressService->getAddressById($id, ['id', 'is_default']);

            if(!$deleted){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'delete_address_failed',
                    'entity_type' => 'Address',
                    'entity_id' => $id,
                    'color' => 'warning',
                    'method' => 'DELETE',
                    'route' => 'addresses.destroy',
                    'message' => 'Adresse non trouvée.',
                    'status_code' => 404,
                    'metadata' => [
                        'error' => 'Adresse non trouvée.'
                    ],
                ]);

                return response()->json([
                    'message' => 'Adresse non trouvée.'
                ], 404);
            }

            $this->addressService->deleteAddress($deleted);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_address',
                'entity_type' => 'Address',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'addresses.destroy',
                'message' => 'Adresse supprimée avec succès.',
                'status_code' => 200,
                'metadata' => [
                    'message' => 'Adresse supprimée avec succès.'
                ],
            ]);

            return response()->json([
                'message' => 'Adresse supprimée avec succès.'
            ], 200);

        }catch(Throwable $e){
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_address_failed',
                'entity_type' => 'Address',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'addresses.destroy',
                'message' => 'Erreur lors de la suppression de l\'adresse.',
                'status_code' => 500,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la suppression de l\'adresse.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function restore(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){
            return response()->json(['message' => 'ID de l\'adresse invalide.'], 400);
        }

        try{

            $address = $this->addressService->getAddressById($id, ['id'], [], false, true);

            if(!$address){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'restore_address_failed',
                    'entity_type' => 'Address',
                    'color' => 'warning',
                    'method' => 'POST',
                    'route' => 'addresses.restore',
                    'message' => 'Adresse non trouvée ou pas supprimée.',
                    'status_code' => 404,
                    'metadata' => [
                        'error' => 'Adresse non trouvée ou pas supprimée.'
                    ],
                ]);

                return response()->json([
                    'message' => 'Adresse non trouvée ou pas supprimée.'
                ], 404);
            }

            $this->addressService->restoreAddress($address);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'restore_address',
                'entity_type' => 'Address',
                'entity_id' => $id,
                'color' => 'success',
                'method' => 'POST',
                'route' => 'addresses.restore',
                'message' => 'Adresse restaurée avec succès.',
                'status_code' => 200,
                'metadata' => [
                    'message' => 'Adresse restaurée avec succès.'
                ],
            ]);

            return response()->json([
                'message' => 'Adresse restaurée avec succès.'
            ], 200);

        }catch(Throwable $e){
            return response()->json([
                'message' => 'Erreur lors de la restauration de l\'adresse.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function forceDelete(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){
            return response()->json(['message' => 'ID de l\'adresse invalide.'], 400);
        }

        try{

            $address = $this->addressService->getAddressById($id, ['id'], [], false, true);

            if(!$address){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'force_delete_address_failed',
                    'entity_type' => 'Address',
                    'color' => 'warning',
                    'method' => 'DELETE',
                    'route' => 'addresses.forceDelete',
                    'message' => 'Adresse non trouvée ou pas supprimée.',
                    'status_code' => 404,
                    'metadata' => [
                        'error' => 'Adresse non trouvée ou pas supprimée.'
                    ],
                ]);

                return response()->json([
                    'message' => 'Adresse non trouvée ou pas supprimée.'
                ], 404);
            }

            $this->addressService->forceDeleteAddress($address);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'force_delete_address',
                'entity_type' => 'Address',
                'entity_id' => $id,
                'color' => 'success',
                'method' => 'DELETE',
                'route' => 'addresses.forceDelete',
                'message' => 'Adresse supprimée définitivement avec succès.',
                'status_code' => 200,
                'metadata' => [
                    'message' => 'Adresse supprimée définitivement avec succès.'
                ],
            ]);

            return response()->json([
                'message' => 'Adresse supprimée définitivement avec succès.'
            ], 200);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'force_delete_address_failed',
                'entity_type' => 'Address',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'addresses.forceDelete',
                'message' => 'Erreur lors de la suppression définitive de l\'adresse.',
                'status_code' => 500,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);
            
            return response()->json([
                'message' => 'Erreur lors de la suppression définitive de l\'adresse.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
