<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use App\Services\StockMovementService;
use Illuminate\Http\Request;
use Throwable;

class StockMovementController extends Controller
{
    public function __construct(private readonly StockMovementService $stockMovementService, private readonly ActivityLogService $activityLogService){}

    public function index(Request $request){
        try{
            $productEncryptedId = $request->query('product', null);
            $productId = decrypt_to_int_or_null($productEncryptedId);

            if(is_null($productId)){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'index_stock_movement_failed',
                    'entity_type' => 'StockMovement',
                    'entity_id' => null,
                    'color' => 'danger',
                    'method' => 'GET',
                    'route' => 'admin.stock_movements.index',
                    'status_code' => 500,
                    'message' => 'ID du produit invalide.',
                    'metadata' => [
                        'encrypted_id' => $productEncryptedId
                    ],
                ]);

                return response()->json(['message' => 'ID du produit invalide.'], 400);
            }

            $constraints['product_id'] = $productId;

            $stockMovements = $this->stockMovementService->getAllStockMovements(
                keys: array_keys($constraints),
                values: array_values($constraints),
                relations: ['product','cityFrom','cityTo','user']
            );

            return response()->json([
                'data' => $stockMovements
            ]);

        }catch(Throwable $e){

            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_stock_movement_failed',
                'entity_type' => 'StockMovement',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.stock_movements.index',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des mouvements du stock.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des mouvements du stock.',
                'error' => $e->getMessage()
            ], 500);

        }
    }
}
