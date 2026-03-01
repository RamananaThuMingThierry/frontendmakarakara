<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Throwable;

class InventoryController extends Controller
{
    public function __construct(private InventoryService $inventoryService, private ActivityLogService $activityLogService){}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try{
            $constraints = [

            ];

            $inventories = $this->inventoryService->getAllInventories(
                keys: array_keys($constraints),
                values: array_values($constraints),
                relations: ['product','cities']
            );

            return response()->json([
                'data' => $inventories
            ]);
        }catch(Throwable $e){
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'index_inventory_failed',
                'entity_type' => 'Inventory',
                'route' => 'admin.inventory.index',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des inventaires.',
                'metadata' => ['error' => $e->getMessage()],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des inventaires.',
                'error' => $e->getMessage(),
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
    public function store(Request $request)
    {
        //
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
