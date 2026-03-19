<?php

namespace App\Http\Controllers\WEB\ADMIN;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Throwable;

class OrderWorkflowController extends Controller
{
    public function __construct(private readonly OrderWorkflowService $orderWorkflowService) {}

    public function confirm(string $encryptedId): JsonResponse
    {
        return $this->handleAction($encryptedId, fn (Order $order) => $this->orderWorkflowService->confirmOrder($order), 'Commande confirmee.');
    }

    public function startProcessing(string $encryptedId): JsonResponse
    {
        return $this->handleAction($encryptedId, fn (Order $order) => $this->orderWorkflowService->startProcessing($order), 'Commande en traitement.');
    }

    public function markAsPaid(string $encryptedId): JsonResponse
    {
        return $this->handleAction($encryptedId, fn (Order $order) => $this->orderWorkflowService->markAsPaid($order), 'Paiement valide.');
    }

    public function cancel(string $encryptedId): JsonResponse
    {
        return $this->handleAction($encryptedId, fn (Order $order) => $this->orderWorkflowService->cancelOrder($order), 'Commande annulee.');
    }

    public function markAsDelivered(string $encryptedId): JsonResponse
    {
        return $this->handleAction($encryptedId, fn (Order $order) => $this->orderWorkflowService->markAsDelivered($order), 'Commande livree.');
    }

    public function sendReceipt(string $encryptedId): JsonResponse
    {
        return $this->handleAction($encryptedId, fn (Order $order) => $this->orderWorkflowService->sendReceipt($order), 'Recu envoye au client.');
    }

    private function handleAction(string $encryptedId, callable $callback, string $message): JsonResponse
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (! $id) {
            return response()->json([
                'message' => 'ID de commande invalide.',
            ], 400);
        }

        $order = Order::query()->find($id);

        if (! $order) {
            return response()->json([
                'message' => 'Commande introuvable.',
            ], 404);
        }

        try {
            $updated = $callback($order);

            return response()->json([
                'message' => $message,
                'data' => $updated,
                'transitions' => $this->orderWorkflowService->allowedTransitions(),
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors du traitement de la commande.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
