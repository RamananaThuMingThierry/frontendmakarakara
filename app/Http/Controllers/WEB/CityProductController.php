<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\CityProductStoreRequest;
use App\Repositories\CityProductRepository;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Throwable;

class CityProductController extends Controller
{
    public function __construct(private CityProductRepository $cityProductRepository, private ActivityLogService $activityLogService){}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try{
            $constraints = [];

            $cityProducts = $this->cityProductRepository->getAll(
                array_keys($constraints),
                array_values($constraints),
                ['*'],
                ['city', 'product']
            );

            return response()->json([
                'data' => $cityProducts
            ]);
        }catch(Throwable $e){

            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_city_product_failed',
                'entity_type' => 'CityProduct',
                'entity_id' => null,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des produits de ville.',
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
    public function store(CityProductStoreRequest $request)
    {
        $data = $request->validated();

        try{

        }catch(Throwable $e){
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_city_product_failed',
                'entity_type' => 'CityProduct',
                'metadata' => [
                    "error" => $e->getMessage()
                ],
            ]);

            return response()->json([
                'message' => 'Échec de la création du produit de ville. '.$e->getMessage()
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
