<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use App\Services\InventoryPriceHistoryService;
use Illuminate\Support\Facades\Auth;
use Throwable;

class InventoryPriceHistoryController extends Controller
{
    public function __construct(private readonly InventoryPriceHistoryService $inventoryPriceHistoryService, private readonly ActivityLogService $activityLogService){}

    public function index(){
        try{
            $constraints = [];

            $inventoryPriceHistories = $this->inventoryPriceHistoryService->getAllInventoryPriceHistories(
                keys: array_keys($constraints),
                values: array_values($constraints)
            );

            return response()->json([
                'data' => $inventoryPriceHistories
            ]);
        }catch(Throwable $e){
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'index_inventory_price_history_failed',
                'entity_type' => 'InventoryPriceHistory',
                'route' => 'admin.inventory_price_histories.index',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des historique des prices inventaires.',
                'metadata' => ['error' => $e->getMessage()],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des historique des prices inventaires.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
