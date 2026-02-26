<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentMethodRequest;
use App\Models\PaymentMethod;
use App\Services\ActivityLogService;
use App\Services\PaymentMethodService;
use Throwable;

class PaymentMethodController extends Controller
{
    public function __construct(private PaymentMethodService $paymentMethodService, private ActivityLogService $activityLogService){}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $constraints = [];

            $paymentMethods = $this->paymentMethodService->getAllPaymentMethods(
                array_keys($constraints),
                array_values($constraints),
            );

            return response()->json([
                'data' => $paymentMethods,
            ], 200);

        } catch (Throwable $e) {

            $this->activityLogService->createActivityLog([
                'user_id'     => auth()->id(),
                'action'      => 'index_payment_methods_failed',
                'entity_type' => 'PaymentMethod',
                'entity_id'   => null,
                'route'       => 'payment_methods.index',
                'color'       => 'danger',
                'method'      => 'GET',
                'status_code' => 500,
                'message'     => 'Erreur lors du chargement des méthodes de paiement.',
                'metadata'    => [
                    'erreur' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des méthodes de paiement.',
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
    public function store(PaymentMethodRequest $request)
    {
        $data = $request->validated();

        try {
            $paymentMethod = $this->paymentMethodService->createPaymentMethod($data);

            $this->activityLogService->createActivityLog([
                'user_id'     => auth()->id(),
                'action'      => 'create_payment_method',
                'entity_type' => 'PaymentMethod',
                'entity_id'   => $paymentMethod->id,
                'color'       => 'success',
                'method'      => 'POST',
                'route'       => 'payment_methods.store',
                'message'     => 'Méthode de paiement créée avec succès.',
                'status_code' => 201,
                'metadata'    => [
                    'nom'       => $paymentMethod->name,
                    'code'      => $paymentMethod->code,
                    'est_actif' => (bool) $paymentMethod->is_active,
                ],
            ]);

            return response()->json([
                'message' => 'Méthode de paiement créée avec succès.',
                'data'    => $paymentMethod,
            ], 201);

        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id'     => auth()->id(),
                'action'      => 'create_payment_method',
                'entity_type' => 'PaymentMethod',
                'entity_id'   => null,
                'color'       => 'error',
                'method'      => 'POST',
                'route'       => 'payment_methods.store',
                'message'     => 'Échec de la création de la méthode de paiement.',
                'status_code' => 500,
                'metadata'    => [
                    'erreur' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Échec de la création de la méthode de paiement.',
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
                'action' => 'show_payment_method_failed',
                'entity_type' => 'PaymentMethod',
                'color' => 'warning',
                'method' => 'GET',
                'route' => 'payment_methods.show',
                'message' => 'ID du méthode de paiement invalide.',
                'status_code' => 400,
                'metadata' => [
                    'error' => 'ID invalide',
                ],
            ]);
            return response()->json(['message' => 'ID du méthode de paiement invalide.'], 400);
        }

        try{
            $paymentMethod = $this->paymentMethodService->getPaymentMethodById($id, ['*']);

            if(!$paymentMethod){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'show_payment_method_failed',
                    'entity_type' => 'PaymentMethod',
                    'color' => 'warning',
                    'method' => 'GET',
                    'route' => 'payment_methods.show',
                    'message' => 'Méthode de paiement non trouvée.',
                    'status_code' => 400,
                    'metadata' => [
                        'error' => 'Méthode de paiement non trouvée.',
                    ],
                ]);

                return response()->json([
                    'message' => 'Méthode de paiement non trouvée.'
                ], 404);
            }

            return response()->json([
                'data' => $paymentMethod,
            ], 200);

        }catch(Throwable $e){
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_payment_method_failed',
                'entity_type' => 'PaymentMethod',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'payment_methods.show',
                'message' => 'Erreur lors du chargement du méthode de paiement.',
                'status_code' => 500,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement du méthode de paiement.',
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
    public function update(PaymentMethod $request, string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_payment_method_failed',
                'entity_type' => 'PaymentMethod',
                'color' => 'warning',
                'method' => 'PUT',
                'route' => 'payment_methods.update',
                'message' => 'ID du méthode de paiement invalide.',
                'status_code' => 400,
                'metadata' => [
                    'error' => 'ID invalide',
                ],
            ]);
            return response()->json(['message' => 'ID du méthode de paiement invalide.'], 400);
        }

        try{
            $data = $request->validated();

            $paymentMethod = $this->paymentMethodService->getPaymentMethodById($id, ['*']);

            if(!$paymentMethod){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'update_payment_method_failed',
                    'entity_type' => 'PaymentMethod',
                    'color' => 'warning',
                    'method' => 'GET',
                    'route' => 'payment_methods.update',
                    'message' => 'Méthode de paiement non trouvée.',
                    'status_code' => 400,
                    'metadata' => [
                        'error' => 'Méthode de paiement non trouvée.',
                    ],
                ]);

                return response()->json([
                    'message' => 'Méthode de paiement non trouvée.'
                ], 404);
            }

            $paymentMethod = $this->paymentMethodService->updatePaymentMethod($paymentMethod, $data);    

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_payment_method',
                'entity_type' => 'PaymentMethod',
                'entity_id' => $id,
                'color' => 'primary',
                'method' => 'PUT',
                'route' => 'payment_methods.update',
                'message' => 'Méthode de paiement mise à jour avec succès.',
                'status_code' => 200 
            ]);

            return response()->json([
                'message' => 'Méthode de paiement mise à jour avec succès.',
                'data'    => $paymentMethod
            ], 200);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_payment_method_failed',
                'entity_type' => 'PaymentMethod',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'payment_methods.update',
                'message' => 'Erreur lors de la mise à jour du méthode de paiement.',
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
                'action' => 'delete_payment_method_failed',
                'entity_type' => 'PaymentMethod',
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'payment_methods.destroy',
                'message' => 'ID du méthode de paiement invalide.',
                'status_code' => 400,
                'metadata' => [
                    'error' => 'ID invalide',
                ],
            ]);
            return response()->json(['message' => 'ID du méthode de paiement invalide.'], 400);
        }

        try{
            $paymentMethod = $this->paymentMethodService->getPaymentMethodById($id, ['*']);

            if(!$paymentMethod){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'delete_payment_method_failed',
                    'entity_type' => 'PaymentMethod',
                    'color' => 'warning',
                    'method' => 'GET',
                    'route' => 'payment_methods.destroy',
                    'message' => 'Méthode de paiement non trouvée.',
                    'status_code' => 400,
                    'metadata' => [
                        'error' => 'Méthode de paiement non trouvée.',
                    ],
                ]);

                return response()->json([
                    'message' => 'Méthode de paiement non trouvée.'
                ], 404);
            }

            $this->paymentMethodService->deletePaymentMethod($paymentMethod);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_payment_method',
                'entity_type' => 'PaymentMethod',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'payment_methods.destroy',
                'message' => 'Méthode de paiement supprimée avec succès.',
                'status_code' => 200,
                'metadata' => [
                    'message' => 'Méthode de paiement supprimée avec succès.'
                ],
            ]);

            return response()->json([
                'message' => 'Méthode de paiement supprimée avec succès.'
            ], 200);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_payment_method_failed',
                'entity_type' => 'PaymentMethod',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'payment_methods.destroy',
                'message' => 'Erreur lors de la suppression du méthode de paiement.',
                'status_code' => 500,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la suppression du méthode de paiement.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
