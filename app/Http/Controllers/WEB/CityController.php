<?php

namespace App\Http\Controllers\WEB;

use Throwable;
use Illuminate\Http\Request;
use App\Services\CityService;
use App\Http\Requests\CityRequest;
use App\Http\Controllers\Controller;
use App\Models\City;
use App\Services\ActivityLogService;

class CityController extends Controller
{
    public function __construct(private CityService $cityService, private ActivityLogService $activityLogService){}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $constraints = [];

        $cities = $this->cityService->getAllCities(
            array_keys($constraints),
            array_values($constraints)
        );

        return response()->json([
            'data' => $cities
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CityRequest $request)
    {
        $data = $request->validated();
        
        try{
            $city = $this->cityService->createCity($data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_city',
                'entity_type' => 'City',
                'entity_id' => $city->id,
                'metadata' => [
                    "name" => $city->name,
                    "region" => $city->region,
                    "is_active" => $city->is_active
                ],
            ]);

            return response()->json([
                'message' => 'Ville créée avec succès.',
                'data'    => $city
            ]);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_city_failed',
                'entity_type' => 'City',
                'metadata' => [
                    "error" => $e->getMessage()
                ],
            ]);

            return response()->json([
                'message' => 'Échec de la création de la ville. '.$e->getMessage()
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
                'action' => 'view_city_failed',
                'entity_type' => 'City',
                'metadata' => [
                    "error" => "ID de ville invalide: $encryptedId"
                ],
            ]);

            return response()->json(['message' => 'ID de ville invalide.'], 400);
        }   

        $city = $this->cityService->getCityById($id, ['*']);

        if(!$city){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'view_city_failed',
                'entity_type' => 'City',
                'entity_id' => $id,
                'metadata' => [
                    "error" => "Ville non trouvée pour ID: $id"
                ],
            ]);

            return response()->json(['message' => 'Ville non trouvée.'], 404);
        }

        return response()->json([
            'data' => $city
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
    public function update(CityRequest $request, string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){
            return response()->json(['message' => 'ID de ville invalide.'], 400);
        }

        $data = $request->validated();

        try{
            $city = $this->cityService->updateCity($id, $data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_city',
                'entity_type' => 'City',
                'entity_id' => $city->id,
                'metadata' => [
                    "name" => $city->name,
                    "region" => $city->region,
                    "is_active" => $city->is_active
                ],
            ]);

            return response()->json([
                'message' => 'Ville mise à jour avec succès.',
                'data'    => $city
            ]);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_city_failed',
                'entity_type' => 'City',
                'entity_id' => $id,
                'metadata' => [
                    "error" => $e->getMessage()
                ],
            ]);

            return response()->json([
                'message' => 'Échec de la mise à jour de la ville. '.$e->getMessage()
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
                'action' => 'delete_city_failed',
                'entity_type' => 'City',
                'metadata' => [
                    "error" => "ID de ville invalide: $encryptedId"
                ],
            ]);

            return response()->json(['message' => 'ID de ville invalide.'], 400);
        }

        $city = $this->cityService->getCityById($id, ['id']);

        if(!$city){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_city_failed',
                'entity_type' => 'City',
                'entity_id' => $id,
                'metadata' => [
                    "error" => "Ville non trouvée pour ID: $id"
                ],
            ]);

            return response()->json(['message' => 'Ville non trouvée.'], 404);
        }

        try{
            $this->cityService->deleteCity($city);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_city',
                'entity_type' => 'City',
                'entity_id' => $id,
            ]);

            return response()->json(['message' => 'Ville supprimée avec succès.']);
            
        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_city_failed',
                'entity_type' => 'City',
                'entity_id' => $id,
                'metadata' => [
                    "error" => $e->getMessage()
                ],
            ]);

            return response()->json([
                'message' => 'Échec de la suppression de la ville. '.$e->getMessage()
            ], 500);
        }
    }
}