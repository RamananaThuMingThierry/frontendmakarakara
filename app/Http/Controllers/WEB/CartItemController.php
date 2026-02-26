<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\CartItemRequest;
use App\Services\ActivityLogService;
use App\Services\CartItemService;
use Throwable;

class CartItemController extends Controller
{
    public function __construct(private CartItemService $cartItemService, private ActivityLogService $activityLogService){}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try{
            $constraints = [];

            $cartItems = $this->cartItemService->getALLCartItems(
                array_keys($constraints),
                array_values($constraints)
            );

            return response()->json([
                'data' => $cartItems
            ]);
        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_cart_item_failed',
                'entity_type' => 'CartItem',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.cart_items.index',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des items du panier.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);
            
            return response()->json([
                'message' => 'Erreur lors du chargement des items du panier.',
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
    public function store(CartItemRequest $request)
    {
        try{
            $data = $request->validated();

            $cartItems = $this->cartItemService->createCartItem($data);

            $this->activityLogService->createActivityLog([
                'user_id'     => auth()->id(),
                'action'      => 'create_cart_item',
                'entity_type' => 'CartItem',
                'entity_id'   => $cartItems->id,
                'color'       => 'success',
                'method'      => 'POST',
                'route'       => 'admin.cart_items.store',
                'message'     => 'Items du panier créée avec succès.',
                'status_code' => 201,
                'metadata'    => [
                    'cart_id' => $cartItems->cart_id,
                    'product_id' => $cartItems->product_id,
                    'quantity' => $cartItems->quantity,
                    'unit_price' => $cartItems->unit_price,
                ],
            ]);

            return response()->json([
                'message' => 'Items du panier créée avec succès.',
                'data'    => $cartItems,
            ], 201);
        }catch(Throwable $e){
            $this->activityLogService->createActivityLog([
                'user_id'     => auth()->id(),
                'action'      => 'create_cart_items',
                'entity_type' => 'CartItem',
                'entity_id'   => null,
                'color'       => 'error',
                'method'      => 'POST',
                'route'       => 'admin.cart_items.store',
                'message'     => 'Échec de la création d\'un item du panier.',
                'status_code' => 500,
                'metadata'    => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Échec de la création d\'un item du panier.',
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $encryptedId){

        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_cart_items_failed',
                'entity_type' => 'CartItem',
                'entity_id' => null,
                'level' => 'danger',
                'method' => 'GET',
                'route' => 'admin.cart_items.show',
                'status_code' => 400,
                'message' => 'ID d\'un item du panier invalide.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ],
            ]);

            return response()->json(['message' => 'ID d\'un item du panier invalide.'], 400);
        }

        $cartItem = $this->cartItemService->getCartItemById($id);

        if(!$cartItem){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_cart_items_failed',
                'entity_type' => 'CartItem',
                'entity_id' => $id,
                'level' => 'danger',
                'method' => 'GET',
                'route' => 'admin.cart_items.show',
                'status_code' => 404,
                'message' => 'Item du panier non trouvée.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ],    
            ]);

            return response()->json(['message' => 'Item du panier non trouvée.'], 404);
        }

        return response()->json([
            'data' => $cartItem
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
    public function update(CartItemRequest $request, string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_cart_item_failed',
                'entity_type' => 'Cart',
                'entity_id' => null,
                'level' => 'danger',
                'method' => 'GET',
                'route' => 'admin.cart_items.show',
                'status_code' => 400,
                'message' => 'ID d\'un item du panier invalide.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ],
            ]);

            return response()->json(['message' => 'ID d\'un item du panier invalide.'], 400);
        }

        $cartItem = $this->cartItemService->getCartItemById($id);

        if(!$cartItem){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_cart_item_failed',
                'entity_type' => 'CartItem',
                'entity_id' => $id,
                'level' => 'danger',
                'method' => 'GET',
                'route' => 'admin.cart_items.show',
                'status_code' => 404,
                'message' => 'Item du panier non trouvée.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ],    
            ]);

            return response()->json(['message' => 'Item du panier non trouvée.'], 404);
        }

        try{
            $data = $request->validated();

            $cartItem = $this->cartItemService->updateCartItem($cartItem, $data);
            
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_cart_item',
                'entity_type' => 'CartItem',
                'entity_id' => $id,
                'color' => 'primary',
                'method' => 'PUT',
                'route' => 'admin.cart_items.update',
                'message' => 'Item du panier mise à jour avec succès.',
                'status_code' => 200 
            ]);

            return response()->json([
                'message' => 'Item du panier mise à jour avec succès.',
                'data'    => $cartItem
            ], 200);
        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_cart_item_failed',
                'entity_type' => 'CartItem',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'admin.cart_items.update',
                'message' => 'Erreur lors de la mise à jour d\'un item du panier.',
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
                'action' => 'delete_cart_item_failed',
                'entity_type' => 'CartItem',
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.cart_items.destroy',
                'message' => 'ID d\'un item du panier invalide.',
                'status_code' => 400,
                'metadata' => [
                    'error' => 'ID invalide',
                ],
            ]);
            return response()->json(['message' => 'ID d\'un item du panier invalide.'], 400);
        }

        try{
            $cartItem = $this->cartItemService->getCartItemById($id, ['*']);

            if(!$cartItem){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'delete_cart_item_failed',
                    'entity_type' => 'CartItem',
                    'color' => 'warning',
                    'method' => 'GET',
                    'route' => 'admin.cart_items.destroy',
                    'message' => 'Item du panier non trouvée.',
                    'status_code' => 400,
                    'metadata' => [
                        'error' => 'Item du panier non trouvée.',
                    ],
                ]);

                return response()->json([
                    'message' => 'Item du panier non trouvée.'
                ], 404);
            }

            $this->cartItemService->deleteCartItem($cartItem);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_cart_item',
                'entity_type' => 'CartItem',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.cart_items.destroy',
                'message' => 'Item du panier supprimée avec succès.',
                'status_code' => 200,
                'metadata' => [
                    'message' => 'Item du panier supprimée avec succès.'
                ],
            ]);

            return response()->json([
                'message' => 'Item du panier supprimée avec succès.'
            ], 200);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_cart_item_failed',
                'entity_type' => 'CartItem',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.cart_items.destroy',
                'message' => 'Erreur lors de la suppression d\'un item panier.',
                'status_code' => 500,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la suppression d\'un item panier.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
