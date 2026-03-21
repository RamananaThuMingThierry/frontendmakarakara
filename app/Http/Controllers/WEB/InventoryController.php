<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryAdjustRequest;
use App\Http\Requests\InventoryRequest;
use App\Http\Requests\InventoryTransfertRequest;
use App\Models\Inventory;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use App\Services\InventoryPriceHistoryService;
use App\Services\InventoryService;
use App\Services\StockMovementService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class InventoryController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly StockMovementService $stockMovementService,
        private readonly ActivityLogService $activityLogService,
        private readonly InventoryPriceHistoryService $inventoryPriceHistoryService,
        private readonly NotificationService $NotificationService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try{
            $constraints = [];

            $inventories = $this->inventoryService->getAllInventories(
                keys: array_keys($constraints),
                values: array_values($constraints),
                relations: ['product','city']
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

    public function shopIndex()
    {
        try {
            $inventories = Inventory::query()
                ->with(['product.category', 'product.images', 'city'])
                ->whereNotNull('city_id')
                ->where('is_available', true)
                ->whereHas('product', function ($query) {
                    $query->where('is_active', true);
                })
                ->whereHas('city', function ($query) {
                    $query->where('is_active', true);
                })
                ->get();

            return response()->json([
                'data' => $inventories,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors du chargement des inventaires boutique.',
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
    public function store(InventoryRequest $request)
    {
        $data = $request->validated();

        try {
            $result = DB::transaction(function () use ($data) {

                // 1) Créer l'inventaire (entrée initiale)
                $inventory = $this->inventoryService->createInventory($data);

                // 2) Créer le mouvement de stock correspondant (entrée "in")
                //    Vu ta table: pour une entrée, on met city_to_id = city_id
                $movementPayload = [
                    'product_id'     => (int) $data['product_id'],
                    'city_to_id'     => (int) $data['city_id'],
                    'city_from_id'   => null,
                    'type'           => 'in',
                    'quantity'       => (int) $data['quantity'],
                    'stock_before'   => 0,
                    'stock_after'    => (int) $data['quantity'],
                    'reason'         => $data['reason'] ?? 'initial_stock',
                    'note'           => $data['note'] ?? 'Création inventaire (entrée stock initiale)',
                    'reference_type' => get_class($inventory), // ou \App\Models\Inventory::class
                    'reference_id'   => $inventory->id,
                    'created_by'     => Auth::id(),
                ];

                $movement = $this->stockMovementService->createStockMovement($movementPayload);
                $this->NotificationService->notifyInventoryAlert(
                    $inventory->fresh(['product:id,name', 'city:id,name'])
                );

                return [
                    'inventory'   => $inventory,
                    'movement'    => $movement
                ];
            });

            return response()->json([
                'message' => 'Inventaire créé avec succès (mouvement stock enregistré).',
                'data'    => $result,
            ], 201);

        } catch (ValidationException $e) {

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_inventory_validation_failed',
                'entity_type' => 'Inventory',
                'entity_id' => null,
                'color' => 'warning',
                'route' => 'admin.inventory.store',
                'status_code' => 422,
                'message' => 'Validation échouée lors de la création d\'inventaire.',
                'metadata' => [
                    'errors' => $e->errors(),
                ],
            ]);

            return response()->json([
                'message' => 'Validation échouée.',
                'errors'  => $e->errors(),
            ], 422);

        } catch (Throwable $e) {

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_inventory_failed',
                'entity_type' => 'Inventory',
                'entity_id' => null,
                'color' => 'danger',
                'route' => 'admin.inventory.store',
                'status_code' => 500,
                'message' => 'Erreur lors de la création d\'inventaire.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création d\'inventaire.',
                'error'   => $e->getMessage(),
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
    public function update(InventoryRequest $request, string $encryptedId)
    {
        $data = $request->validated();

        try {

            $id = decrypt_to_int_or_null($encryptedId);

            if(is_null($id)){
                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'update_inventory_failed',
                    'entity_type' => 'Inventory',
                    'entity_id' => null,
                    'color' => 'danger',
                    'method' => 'GET',
                    'route' => 'admin.inventory.update',
                    'status_code' => 400,
                    'message' => 'ID de l\'inventaire invalide.',
                    'metadata' => [
                        'encrypted_id' => $encryptedId,
                    ],
                ]);

                return response()->json(['message' => 'ID d\'inventaire invalide.'], 400);
            }

            $inventory = $this->inventoryService->getInventoryById($id, ['*']);

            if (!$inventory) {

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'show_inventory_failed',
                    'entity_type' => 'Inventory',
                    'entity_id' => null,
                    'color' => 'danger',
                    'method' => 'GET',
                    'route' => 'admin.inventory.update',
                    'status_code' => 400,
                    'message' => 'Inventaire introuvable.',
                    'metadata' => [
                        'encrypted_id' => $encryptedId,
                    ],
                ]);

                return response()->json(['message' => 'Inventaire introuvable.'], 404);
            }

            $oldPrice = (float) $inventory->price;
            $newPrice = array_key_exists('price', $data) ? (float) $data['price'] : $oldPrice;

            if($oldPrice != $newPrice){

                $pricePayload = [
                    'product_id' => $inventory->product_id,
                    'city_id' => $inventory->city_id,
                    'old_price' => $oldPrice,
                    'new_price' => $newPrice,
                    'changed_by' => Auth::id()
                ];

                $this->inventoryPriceHistoryService->createInventoryPriceHistory($pricePayload);
            }

            // 1️⃣ Mise à jour inventaire
            $previousStatus = (string) $inventory->status;
            $updatedInventory = $this->inventoryService->updateInventory($id, $data);
            $this->NotificationService->notifyInventoryAlert(
                $updatedInventory->fresh(['product:id,name', 'city:id,name']),
                $previousStatus
            );

            return response()->json([
                'message' => 'Inventaire mis à jour avec succès.',
                'data' => $updatedInventory
            ]);

        } catch (ValidationException $e) {

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_inventory_validation_failed',
                'entity_type' => 'Inventory',
                'entity_id' => $id,
                'color' => 'warning',
                'route' => 'admin.inventory.update',
                'status_code' => 422,
                'message' => 'Validation échouée lors de la mise à jour de l\'inventaire.',
                'metadata' => [
                    'errors' => $e->errors()
                ],
            ]);

            return response()->json([
                'message' => 'Validation échouée.',
                'errors' => $e->errors()
            ], 422);

        } catch (Throwable $e) {

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_inventory_failed',
                'entity_type' => 'Inventory',
                'entity_id' => $id,
                'color' => 'danger',
                'route' => 'admin.inventory.update',
                'status_code' => 500,
                'message' => 'Erreur lors de la mise à jour de l\'inventaire.',
                'metadata' => [
                    'error' => $e->getMessage()
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la mise à jour de l\'inventaire.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function adjust(InventoryAdjustRequest $request, string $encryptedId)
    {
        $data = $request->validated();

        try {
            $id = decrypt_to_int_or_null($encryptedId);

            if (is_null($id)) {

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'adjust_inventory_failed',
                    'entity_type' => 'Inventory',
                    'entity_id' => null,
                    'color' => 'danger',
                    'method' => 'GET',
                    'route' => 'admin.inventory.adjust',
                    'status_code' => 400,
                    'message' => 'ID de l\'inventaire invalide.',
                    'metadata' => [
                        'encrypted_id' => $encryptedId,
                    ],
                ]);

                return response()->json(['message' => 'ID d\'inventaire invalide.'], 400);
            }

            $result = DB::transaction(function () use ($id, $data) {
                $inventory = $this->inventoryService->getInventoryById($id, ['*']);

                if (!$inventory) {
                    throw ValidationException::withMessages([
                        'inventory' => ['Inventaire introuvable.']
                    ]);
                }

                $adjustQty = (int) $data['quantity'];
                $oldQuantity = (int) $inventory->quantity;

                switch($data['type']){
                    case 'up':
                        $newQuantity = $oldQuantity + $adjustQty;
                        break;
                    case 'down':
                        if($adjustQty > $oldQuantity){
                            throw ValidationException::withMessages([
                                'quantity' => ['La quantité à retirer dépasse le stock disponible.']
                            ]);
                        }
                        $newQuantity = $oldQuantity - $adjustQty;
                    break;
                }

                $movementPayload = [
                    'product_id'     => $inventory->product_id,
                    'city_to_id'     => $data['type'] === 'up' ? $inventory->city_id : null,
                    'city_from_id'   => $data['type'] === 'down' ? $inventory->city_id : null,
                    'type'           => $data['type'] === 'up' ? 'in' : 'out',
                    'quantity'       => $adjustQty,
                    'stock_before'   => $oldQuantity,
                    'stock_after'    => $newQuantity,
                    'reason'         => $data['reason'],
                    'note'           => $data['note'] ?? null,
                    'reference_type' => get_class($inventory),
                    'reference_id'   => $inventory->id,
                    'created_by'     => Auth::id(),
                ];

                $movement = $this->stockMovementService->createStockMovement($movementPayload);

                $previousStatus = (string) $inventory->status;
                $updatedInventory = $this->inventoryService->updateInventory($id, [
                    'quantity' => $newQuantity
                ]);
                $this->NotificationService->notifyInventoryAlert(
                    $updatedInventory->fresh(['product:id,name', 'city:id,name']),
                    $previousStatus
                );

                $this->activityLogService->createActivityLog([
                    'user_id' => Auth::id(),
                    'action' => 'adjust_inventory',
                    'entity_type' => 'Inventory',
                    'entity_id' => null,
                    'color' => 'warning',
                    'route' => 'admin.inventory.adjust',
                    'status_code' => 200,
                    'message' => 'Ajustement de stock effectué avec succès.',
                    'metadata' => [
                        'inventory' => $updatedInventory,
                        'movement' => $movement
                    ],
                ]);


                return [
                    'inventory' => $updatedInventory,
                    'movement' => $movement
                ];
            });

            return response()->json([
                'message' => 'Ajustement de stock effectué avec succès.',
                'data' => $result
            ]);

        } catch (ValidationException $e) {

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'adjust_inventory_validation_failed',
                'entity_type' => 'Inventory',
                'entity_id' => null,
                'color' => 'warning',
                'route' => 'admin.inventory.adjust',
                'status_code' => 422,
                'message' => 'Validation échouée lors de l\'adjustement du stock.',
                'metadata' => [
                    'errors' => $e->errors(),
                ],
            ]);

            return response()->json([
                'message' => 'Validation échouée.',
                'errors' => $e->errors()
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors de l’ajustement du stock.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function transfert(InventoryTransfertRequest $request, string $encryptedId)
    {
        $data = $request->validated();
        $id = null;

        try {
            $id = decrypt_to_int_or_null($encryptedId);

            if (is_null($id)) {
                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'transfert_inventory_failed',
                    'entity_type' => 'Inventory',
                    'entity_id' => null,
                    'color' => 'danger',
                    'method' => 'POST',
                    'route' => 'admin.inventory.transfert',
                    'status_code' => 400,
                    'message' => 'ID de l\'inventaire invalide.',
                    'metadata' => [
                        'encrypted_id' => $encryptedId,
                    ],
                ]);

                return response()->json([
                    'message' => 'ID d\'inventaire invalide.'
                ], 400);
            }

            $result = DB::transaction(function () use ($id, $data) {
                $sourceInventory = $this->inventoryService->getInventoryById($id, ['*']);

                if (!$sourceInventory) {
                    throw ValidationException::withMessages([
                        'inventory' => ['Inventaire introuvable.']
                    ]);
                }

                if ((int) $data['product_id'] !== (int) $sourceInventory->product_id) {
                    throw ValidationException::withMessages([
                        'product_id' => ['Le produit ne correspond pas à l’inventaire sélectionné.']
                    ]);
                }

                $transferQty = (int) $data['quantity'];
                $oldSourceQuantity = (int) $sourceInventory->quantity;

                if ($transferQty <= 0) {
                    throw ValidationException::withMessages([
                        'quantity' => ['La quantité à transférer doit être supérieure à 0.']
                    ]);
                }

                if ($transferQty > $oldSourceQuantity) {
                    throw ValidationException::withMessages([
                        'quantity' => ['La quantité à transférer dépasse le stock disponible.']
                    ]);
                }

                $sourceCityId = (int) $sourceInventory->city_id;
                $destinationCityId = (int) $data['city_to_id'];

                if ($sourceCityId === $destinationCityId) {
                    throw ValidationException::withMessages([
                        'city_to_id' => ['La ville de destination doit être différente de la ville source.']
                    ]);
                }

                if ((int) $data['city_from_id'] !== $sourceCityId) {
                    throw ValidationException::withMessages([
                        'city_from_id' => ['La ville source ne correspond pas à l’inventaire sélectionné.']
                    ]);
                }

                $newSourceQuantity = $oldSourceQuantity - $transferQty;

                // Recherche inventaire destination
                $destinationInventoryConstraints = [
                    'product_id' => $data['product_id'],
                    'city_id'    => $destinationCityId,
                ];

                $destinationInventory = $this->inventoryService->getInventoryByKeys(
                    array_keys($destinationInventoryConstraints),
                    array_values($destinationInventoryConstraints)
                );

                $oldDestinationQuantity = 0;
                $newDestinationQuantity = $transferQty;

                if ($destinationInventory) {
                    $oldDestinationQuantity = (int) $destinationInventory->quantity;
                    $newDestinationQuantity = $oldDestinationQuantity + $transferQty;

                    $destinationPreviousStatus = (string) $destinationInventory->status;
                    $updatedDestinationInventory = $this->inventoryService->updateInventory(
                        $destinationInventory->id,
                        ['quantity' => $newDestinationQuantity]
                    );
                    $this->NotificationService->notifyInventoryAlert(
                        $updatedDestinationInventory->fresh(['product:id,name', 'city:id,name']),
                        $destinationPreviousStatus
                    );
                } else {
                    $updatedDestinationInventory = $this->inventoryService->createInventory([
                        'product_id' => $data['product_id'],
                        'city_id'    => $destinationCityId,
                        'quantity'   => $transferQty,
                        'price'      => $sourceInventory->price,
                    ]);
                    $this->NotificationService->notifyInventoryAlert(
                        $updatedDestinationInventory->fresh(['product:id,name', 'city:id,name'])
                    );
                }

                // Mise à jour inventaire source
                $sourcePreviousStatus = (string) $sourceInventory->status;
                $updatedSourceInventory = $this->inventoryService->updateInventory($id, [
                    'quantity' => $newSourceQuantity
                ]);
                $this->NotificationService->notifyInventoryAlert(
                    $updatedSourceInventory->fresh(['product:id,name', 'city:id,name']),
                    $sourcePreviousStatus
                );

                /**
                 * 1. Mouvement OUT : sortie depuis la source
                 */
                $movementOutPayload = [
                    'product_id'     => $sourceInventory->product_id,
                    'city_to_id'     => null,
                    'city_from_id'   => $sourceCityId,
                    'type'           => 'out',
                    'quantity'       => $transferQty,
                    'stock_before'   => $oldSourceQuantity,
                    'stock_after'    => $newSourceQuantity,
                    'reason'         => $data['reason'],
                    'note'           => $data['note'] ?? null,
                    'reference_type' => get_class($sourceInventory),
                    'reference_id'   => $sourceInventory->id,
                    'created_by'     => Auth::id(),
                ];

                $movementOut = $this->stockMovementService->createStockMovement($movementOutPayload);

                /**
                 * 2. Mouvement IN : entrée dans la destination
                 */
                $movementInPayload = [
                    'product_id'     => $sourceInventory->product_id,
                    'city_to_id'     => $destinationCityId,
                    'city_from_id'   => null,
                    'type'           => 'in',
                    'quantity'       => $transferQty,
                    'stock_before'   => $oldDestinationQuantity,
                    'stock_after'    => $newDestinationQuantity,
                    'reason'         => $data['reason'],
                    'note'           => $data['note'] ?? null,
                    'reference_type' => get_class($updatedDestinationInventory),
                    'reference_id'   => $updatedDestinationInventory->id,
                    'created_by'     => Auth::id(),
                ];

                $movementIn = $this->stockMovementService->createStockMovement($movementInPayload);

                /**
                 * 3. Mouvement global TRANSFERT
                 */
                $movementTransferPayload = [
                    'product_id'     => $sourceInventory->product_id,
                    'city_to_id'     => $destinationCityId,
                    'city_from_id'   => $sourceCityId,
                    'type'           => 'transfert',
                    'quantity'       => $transferQty,
                    'stock_before'   => $oldSourceQuantity,
                    'stock_after'    => $newSourceQuantity,
                    'reason'         => $data['reason'],
                    'note'           => $data['note'] ?? null,
                    'reference_type' => get_class($sourceInventory),
                    'reference_id'   => $sourceInventory->id,
                    'created_by'     => Auth::id(),
                ];

                $movementTransfer = $this->stockMovementService->createStockMovement($movementTransferPayload);

                $this->activityLogService->createActivityLog([
                    'user_id' => Auth::id(),
                    'action' => 'transfert_inventory',
                    'entity_type' => 'Inventory',
                    'entity_id' => $sourceInventory->id,
                    'color' => 'warning',
                    'route' => 'admin.inventory.transfert',
                    'status_code' => 200,
                    'message' => 'Transfert de stock effectué avec succès.',
                    'metadata' => [
                        'source_inventory' => $updatedSourceInventory,
                        'destination_inventory' => $updatedDestinationInventory,
                        'movement_out' => $movementOut,
                        'movement_in' => $movementIn,
                        'movement_transfer' => $movementTransfer,
                    ],
                ]);

                return [
                    'source_inventory' => $updatedSourceInventory,
                    'destination_inventory' => $updatedDestinationInventory,
                    'movements' => [
                        'out' => $movementOut,
                        'in' => $movementIn,
                        'transfer' => $movementTransfer,
                    ],
                ];
            });

            return response()->json([
                'message' => 'Transfert de stock effectué avec succès.',
                'data' => $result
            ], 200);

        } catch (ValidationException $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'transfert_inventory_validation_failed',
                'entity_type' => 'Inventory',
                'entity_id' => $id,
                'color' => 'warning',
                'route' => 'admin.inventory.transfert',
                'status_code' => 422,
                'message' => 'Validation échouée lors du transfert du stock.',
                'metadata' => [
                    'errors' => $e->errors(),
                ],
            ]);

            return response()->json([
                'message' => 'Validation échouée.',
                'errors' => $e->errors()
            ], 422);

        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'transfert_inventory_failed',
                'entity_type' => 'Inventory',
                'entity_id' => $id,
                'color' => 'danger',
                'route' => 'admin.inventory.transfert',
                'status_code' => 500,
                'message' => 'Erreur lors du transfert du stock.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du transfert du stock.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
