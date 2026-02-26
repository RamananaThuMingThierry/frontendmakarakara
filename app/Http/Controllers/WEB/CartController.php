<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\CartRequest;
use App\Services\ActivityLogService;
use App\Services\CartService;
use Throwable;

class CartController extends Controller
{
    public function __construct(private CartService $cartService, private ActivityLogService $activityLogService){}

    public function index()
    {
        try{
            $constraints = [];

            $carts = $this->cartService->getAllCarts(
                array_keys($constraints),
                array_values($constraints)
            );

            return response()->json([
                'data' => $carts
            ]);

        }catch(Throwable $e){

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
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CartRequest $request)
    {
        $data = $request->validated();

        try{

            $cart = $this->cartService->createCart($data);

            $this->activityLogService->createActivityLog([
                'user_id'     => auth()->id(),
                'action'      => 'create_cart',
                'entity_type' => 'Cart',
                'entity_id'   => $cart->id,
                'color'       => 'success',
                'method'      => 'POST',
                'route'       => 'carts.store',
                'message'     => 'Panier créée avec succès.',
                'status_code' => 201,
                'metadata'    => [
                    'user_id' => $cart->user_id,
                    'status'  => $cart->status 
                ],
            ]);

            return response()->json([
                'message' => 'Panier créée avec succès.',
                'data'    => $cart,
            ], 201);

        }catch(Throwable $e){
            $this->activityLogService->createActivityLog([
                'user_id'     => auth()->id(),
                'action'      => 'create_cart',
                'entity_type' => 'Cart',
                'entity_id'   => null,
                'color'       => 'error',
                'method'      => 'POST',
                'route'       => 'carts.store',
                'message'     => 'Échec de la création d\'une panier.',
                'status_code' => 500,
                'metadata'    => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Échec de la création d\'une panier.',
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
                'action' => 'show_cart_failed',
                'entity_type' => 'Cart',
                'entity_id' => null,
                'level' => 'danger',
                'method' => 'GET',
                'route' => 'admin.carts.show',
                'status_code' => 400,
                'message' => 'ID de panier invalide.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ],
            ]);

            return response()->json(['message' => 'ID de panier invalide.'], 400);
        }

        $cart = $this->cartService->getCartById($id);

        if(!$cart){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_cart_failed',
                'entity_type' => 'Cart',
                'entity_id' => $id,
                'level' => 'danger',
                'method' => 'GET',
                'route' => 'admin.cart.show',
                'status_code' => 404,
                'message' => 'Panier non trouvée.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ],    
            ]);

            return response()->json(['message' => 'Panier non trouvée.'], 404);
        }

        return response()->json([
            'data' => $cart
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
    public function update(CartRequest $request, string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_cart_failed',
                'entity_type' => 'Cart',
                'entity_id' => null,
                'level' => 'danger',
                'method' => 'GET',
                'route' => 'admin.carts.show',
                'status_code' => 400,
                'message' => 'ID de panier invalide.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ],
            ]);

            return response()->json(['message' => 'ID de panier invalide.'], 400);
        }

        $cart = $this->cartService->getCartById($id);

        if(!$cart){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_cart_failed',
                'entity_type' => 'Cart',
                'entity_id' => $id,
                'level' => 'danger',
                'method' => 'GET',
                'route' => 'admin.cart.show',
                'status_code' => 404,
                'message' => 'Panier non trouvée.',
                'metadata' => [
                    'encrypted_id' => $encryptedId
                ],    
            ]);

            return response()->json(['message' => 'Panier non trouvée.'], 404);
        }

        try{
            $data = $request->validated();

            $cart = $this->cartService->updateCart($cart, $data);
            
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_cart',
                'entity_type' => 'Cart',
                'entity_id' => $id,
                'color' => 'primary',
                'method' => 'PUT',
                'route' => 'carts.update',
                'message' => 'Panier mise à jour avec succès.',
                'status_code' => 200 
            ]);

            return response()->json([
                'message' => 'Panier mise à jour avec succès.',
                'data'    => $cart
            ], 200);
        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_cart_failed',
                'entity_type' => 'Cart',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'carts.update',
                'message' => 'Erreur lors de la mise à jour du panier.',
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
                'action' => 'delete_cart_failed',
                'entity_type' => 'Cart',
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'carts.destroy',
                'message' => 'ID du panier invalide.',
                'status_code' => 400,
                'metadata' => [
                    'error' => 'ID invalide',
                ],
            ]);
            return response()->json(['message' => 'ID du panier invalide.'], 400);
        }

        try{
            $cart = $this->cartService->getCartById($id, ['*']);

            if(!$cart){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'delete_cart_failed',
                    'entity_type' => 'Cart',
                    'color' => 'warning',
                    'method' => 'GET',
                    'route' => 'carts.destroy',
                    'message' => 'Panier non trouvée.',
                    'status_code' => 400,
                    'metadata' => [
                        'error' => 'Panier non trouvée.',
                    ],
                ]);

                return response()->json([
                    'message' => 'Panier non trouvée.'
                ], 404);
            }

            $this->cartService->deleteCart($cart);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_cart',
                'entity_type' => 'Cart',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'carts.destroy',
                'message' => 'panier supprimée avec succès.',
                'status_code' => 200,
                'metadata' => [
                    'message' => 'panier supprimée avec succès.'
                ],
            ]);

            return response()->json([
                'message' => 'panier supprimée avec succès.'
            ], 200);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_cart_failed',
                'entity_type' => 'Cart',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'carts.destroy',
                'message' => 'Erreur lors de la suppression du panier.',
                'status_code' => 500,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la suppression du panier.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
