<?php

namespace App\Http\Controllers\WEB\ADMIN;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\Auth;
use Throwable;
use App\Services\ActivityLogService;

class OrderController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLogService) {}

    public function index()
    {
        try {
            $orders = Order::query()
                ->with([
                    'user:id,name,email',
                    'items:id,order_id,product_name,quantity,unit_price,line_total',
                    'address:id,full_name,phone,address_line1,address_line2,city_name,region',
                    'paymentMethod:id,name,code,image,is_active',
                    'invoice:id,order_id,number,status,issued_at',
                    'receipt:id,order_id,number,paid_at,payment_method',
                ])
                ->latest()
                ->get()
                ->map(fn (Order $order) => $this->formatOrder($order))
                ->values();

            return response()->json([
                'data' => $orders,
            ]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'index_order_failed',
                'entity_type' => 'Order',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.orders.index',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des commandes.',
                'metadata' => ['error' => $e->getMessage()],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des commandes.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            return response()->json([
                'message' => 'ID de commande invalide.',
            ], 400);
        }

        try {
            $order = Order::query()
                ->with([
                    'user:id,name,email',
                    'items:id,order_id,product_name,quantity,unit_price,line_total',
                    'address:id,full_name,phone,address_line1,address_line2,city_name,region,latitude,longitude',
                    'paymentMethod:id,name,code,image,is_active',
                    'invoice:id,order_id,number,status,issued_at',
                    'receipt:id,order_id,number,paid_at,payment_method',
                ])
                ->find($id);

            if (! $order) {
                return response()->json([
                    'message' => 'Commande introuvable.',
                ], 404);
            }

            return response()->json([
                'data' => $this->formatOrder($order),
            ]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'show_order_failed',
                'entity_type' => 'Order',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.orders.show',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement de la commande.',
                'metadata' => ['error' => $e->getMessage()],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement de la commande.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function formatOrder(Order $order): array
    {
        $itemsCount = $order->items->count();
        $quantity = (int) $order->items->sum('quantity');
        $paymentMethodLabel = $order->paymentMethod?->name
            ?? $order->paymentMethod?->code
            ?? $order->payment_method?->value
            ?? $order->payment_method;

        return [
            'id' => $order->id,
            'encrypted_id' => $order->encrypted_id,
            'order_number' => $order->order_number,
            'user_name' => $order->user?->name,
            'user_email' => $order->user?->email,
            'status' => $order->status?->value ?? $order->status,
            'payment_status' => $order->payment_status?->value ?? $order->payment_status,
            'payment_method' => $paymentMethodLabel,
            'payment_method_name' => $paymentMethodLabel,
            'payment_method_code' => $order->paymentMethod?->code ?? ($order->payment_method?->value ?? $order->payment_method),
            'subtotal' => (float) $order->subtotal,
            'discount_total' => (float) $order->discount_total,
            'delivery_fee' => (float) $order->delivery_fee,
            'total' => (float) $order->total,
            'notes' => $order->notes,
            'items_count' => $itemsCount,
            'quantity' => $quantity,
            'created_at' => $order->created_at?->toISOString(),
            'updated_at' => $order->updated_at?->toISOString(),
            'address' => $order->address ? [
                'full_name' => $order->address->full_name,
                'phone' => $order->address->phone,
                'address_line1' => $order->address->address_line1,
                'address_line2' => $order->address->address_line2,
                'city_name' => $order->address->city_name,
                'region' => $order->address->region,
                'latitude' => $order->address->latitude,
                'longitude' => $order->address->longitude,
            ] : null,
            'invoice' => $order->invoice ? [
                'number' => $order->invoice->number,
                'status' => $order->invoice->status?->value ?? $order->invoice->status,
                'issued_at' => $order->invoice->issued_at?->toISOString(),
            ] : null,
            'receipt' => $order->receipt ? [
                'number' => $order->receipt->number,
                'paid_at' => $order->receipt->paid_at?->toISOString(),
                'sent_at' => $order->receipt->sent_at?->toISOString(),
                'payment_method' => $order->receipt->payment_method?->value ?? $order->receipt->payment_method,
            ] : null,
            'items' => $order->items
                ->map(fn (OrderItem $item) => [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'sku' => $item->sku,
                    'quantity' => (int) $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'line_total' => (float) $item->line_total,
                ])
                ->values()
                ->all(),
        ];
    }
}
