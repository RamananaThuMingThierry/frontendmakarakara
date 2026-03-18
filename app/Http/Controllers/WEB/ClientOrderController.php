<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Cart;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class ClientOrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = Order::query()
            ->with(['items:id,order_id,product_name,quantity,unit_price,line_total', 'address'])
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
            'payment_method' => ['required', 'string', 'in:cash,mobile_money'],
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
            $order = DB::transaction(function () use ($request, $validated) {
                $user = $request->user();
                $this->releaseExpiredReservations($user->id);
                $cart = Cart::query()
                    ->where('user_id', $user->id)
                    ->first();
                $itemsPayload = collect($validated['items']);
                $products = Product::query()
                    ->whereIn('id', $itemsPayload->pluck('product_id')->all())
                    ->get(['id', 'name', 'sku', 'price'])
                    ->keyBy('id');

                $subtotal = 0;

                foreach ($itemsPayload as $item) {
                    $product = $products->get($item['product_id']);

                    if (! $product) {
                        throw ValidationException::withMessages([
                            'items' => 'Un produit de la commande est introuvable.',
                        ]);
                    }

                    $subtotal += (float) $product->price * (int) $item['quantity'];
                }

                $discountTotal = 0;
                $deliveryFee = $subtotal >= 150000 ? 0 : 5000;
                $total = max(0, $subtotal - $discountTotal) + $deliveryFee;

                $address = Address::create([
                    'user_id' => $user->id,
                    'label' => 'Livraison',
                    'full_name' => $validated['address']['full_name'],
                    'phone' => $validated['address']['phone'],
                    'address_line1' => $validated['address']['address_line1'],
                    'address_line2' => $validated['address']['address_line2'] ?? null,
                    'city_name' => $validated['address']['city_name'],
                    'region' => $validated['address']['region'] ?? null,
                    'latitude' => $validated['address']['latitude'] ?? null,
                    'longitude' => $validated['address']['longitude'] ?? null,
                    'is_default' => false,
                ]);

                $order = Order::create([
                    'user_id' => $user->id,
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'subtotal' => $subtotal,
                    'discount_total' => $discountTotal,
                    'delivery_fee' => $deliveryFee,
                    'coupon_code' => $validated['coupon_code'] ?? null,
                    'payment_method_id' => null,
                    'payment_reference' => null,
                    'total' => $total,
                    'notes' => $validated['notes'] ?? null,
                    'address_id' => $address->id,
                ]);

                foreach ($itemsPayload as $item) {
                    $product = $products->get($item['product_id']);
                    $quantity = (int) $item['quantity'];
                    $unitPrice = (float) $product->price;

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'sku' => $product->sku,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'line_total' => $unitPrice * $quantity,
                    ]);
                }

                if ($cart) {
                    $this->consumeCartReservations($cart->id, $user->id, $order->id);
                    $cart->items()->delete();
                }

                return $order->load(['items:id,order_id,product_name,quantity,unit_price,line_total', 'address']);
            });

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

    private function releaseExpiredReservations(int $userId): void
    {
        $reservations = Reservation::query()
            ->with('items')
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->lockForUpdate()
            ->get();

        foreach ($reservations as $reservation) {
            foreach ($reservation->items as $reservationItem) {
                $inventory = Inventory::query()
                    ->where('product_id', $reservationItem->product_id)
                    ->where('city_id', $reservationItem->city_id)
                    ->lockForUpdate()
                    ->first();

                if ($inventory) {
                    $inventory->update([
                        'reserved_quantity' => max(0, (int) $inventory->reserved_quantity - (int) $reservationItem->quantity),
                    ]);
                }
            }

            $reservation->markReleased('expired');
        }
    }

    private function consumeCartReservations(int $cartId, int $userId, int $orderId): void
    {
        $reservations = Reservation::query()
            ->with('items')
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->where('cart_id', $cartId)
            ->lockForUpdate()
            ->get();

        foreach ($reservations as $reservation) {
            foreach ($reservation->items as $reservationItem) {
                $inventory = Inventory::query()
                    ->where('product_id', $reservationItem->product_id)
                    ->where('city_id', $reservationItem->city_id)
                    ->lockForUpdate()
                    ->first();

                if ($inventory) {
                    $inventory->update([
                        'reserved_quantity' => max(0, (int) $inventory->reserved_quantity - (int) $reservationItem->quantity),
                    ]);
                }
            }

            $reservation->update([
                'reference_type' => Order::class,
                'reference_id' => $orderId,
            ]);
            $reservation->markConsumed($orderId);
        }
    }
}
