<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Services\SettingsService;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Order;
use App\Services\OrderWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class ClientOrderController extends Controller
{
    public function __construct(
        private readonly OrderWorkflowService $orderWorkflowService,
        private readonly SettingsService $settingsService
    ) {}

    public function index(Request $request)
    {
        $orders = Order::query()
            ->with(['items:id,order_id,product_name,quantity,unit_price,line_total', 'address', 'invoice', 'receipt'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'data' => $orders,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'coupon_code' => ['nullable', 'string', 'max:100'],
            'payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],
            'payment_method' => ['nullable', 'string', 'in:cash,mobile_money'],
            'notes' => ['nullable', 'string'],
            'address.full_name' => ['required', 'string', 'max:255'],
            'address.phone' => ['required', 'string', 'max:50'],
            'address.address_line1' => ['required', 'string', 'max:255'],
            'address.address_line2' => ['nullable', 'string', 'max:255'],
            'address.city_name' => ['required', 'string', 'max:120'],
            'address.region' => ['nullable', 'string', 'max:120'],
            'address.latitude' => ['nullable', 'numeric'],
            'address.longitude' => ['nullable', 'numeric'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        try {
            $order = $this->orderWorkflowService->createOrder($request->user(), $validated);

            return response()->json([
                'message' => 'Commande creee avec succes.',
                'data' => $order,
            ], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors de la creation de la commande.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, int $orderId)
    {
        $order = Order::query()
            ->where('id', $orderId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Commande introuvable.',
            ], 404);
        }

        try {
            $updatedOrder = $this->orderWorkflowService->cancelOrder($order);

            return response()->json([
                'message' => 'Commande annulee avec succes.',
                'data' => $updatedOrder,
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors de l annulation de la commande.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function downloadInvoice(Request $request, int $orderId)
    {
        $order = Order::query()
            ->with(['user', 'items', 'address', 'invoice'])
            ->where('id', $orderId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Commande introuvable.',
            ], 404);
        }

        if (! $order->invoice) {
            return response()->json([
                'message' => 'Aucune facture n est disponible pour cette commande.',
            ], 404);
        }

        $platform = $this->settingsService->getAboutPlatform();
        $logoPath = null;

        if (! empty($platform['logo'])) {
            $candidate = public_path(ltrim((string) $platform['logo'], '/'));
            if (file_exists($candidate)) {
                $logoPath = $candidate;
            }
        }

        $pdf = Pdf::loadView('pdf.invoice', [
            'order' => $order,
            'platform' => $platform,
            'logoPath' => $logoPath,
        ])->setPaper('a4');

        $filename = sprintf(
            'facture-%s.pdf',
            $order->invoice->number ?? $order->order_number
        );

        return response()->streamDownload(function () use ($pdf) {
            echo $pdf->output();
        }, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }
}
