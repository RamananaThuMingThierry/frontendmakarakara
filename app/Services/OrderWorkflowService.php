<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethodCode;
use App\Enums\PaymentStatus;
use App\Mail\OrderInvoiceMail;
use App\Mail\OrderReceiptMail;
use App\Models\Address;
use App\Models\Cart;
use App\Models\Inventory;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Receipt;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class OrderWorkflowService
{
    public function __construct(private readonly SettingsService $settingsService) {}

    public const ALLOWED_TRANSITIONS = [
        OrderStatus::PENDING->value => [
            OrderStatus::CONFIRMED->value,
            OrderStatus::CANCELLED->value,
        ],
        OrderStatus::CONFIRMED->value => [
            OrderStatus::PROCESSING->value,
            OrderStatus::DELIVERED->value,
            OrderStatus::CANCELLED->value,
        ],
        OrderStatus::PROCESSING->value => [
            OrderStatus::DELIVERED->value,
            OrderStatus::CANCELLED->value,
        ],
        OrderStatus::DELIVERED->value => [],
        OrderStatus::CANCELLED->value => [],
    ];

    public function createOrder(User $user, array $validated): Order
    {
        $order = DB::transaction(function () use ($user, $validated) {
            $this->releaseExpiredReservations($user->id);

            $paymentMethod = PaymentMethodCode::tryFrom((string) $validated['payment_method']);
            if (! $paymentMethod) {
                throw ValidationException::withMessages([
                    'payment_method' => ['Le moyen de paiement est invalide.'],
                ]);
            }

            $cart = Cart::query()->where('user_id', $user->id)->first();
            $itemsPayload = collect($validated['items']);
            $products = Product::query()
                ->whereIn('id', $itemsPayload->pluck('product_id')->all())
                ->get(['id', 'name', 'sku', 'price'])
                ->keyBy('id');

            $subtotal = 0.0;

            foreach ($itemsPayload as $item) {
                $product = $products->get($item['product_id']);

                if (! $product) {
                    throw ValidationException::withMessages([
                        'items' => ['Un produit de la commande est introuvable.'],
                    ]);
                }

                $subtotal += (float) $product->price * (int) $item['quantity'];
            }

            $discountTotal = 0.0;
            $deliveryFee = $subtotal >= 150000 ? 0.0 : 5000.0;
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
                'status' => OrderStatus::PENDING,
                'payment_method' => $paymentMethod,
                'payment_status' => $this->initialPaymentStatusFor($paymentMethod),
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

            $this->createInitialInvoice($order);

            if ($cart) {
                $this->consumeCartReservations($cart->id, $user->id, $order->id);
                $cart->items()->delete();
            }

            return $this->freshOrder($order);
        });

        $this->sendInvoiceIfNeeded($order);

        return $this->freshOrder($order);
    }

    public function confirmOrder(Order $order): Order
    {
        return $this->transitionOrder($order, OrderStatus::CONFIRMED);
    }

    public function startProcessing(Order $order): Order
    {
        return $this->transitionOrder($order, OrderStatus::PROCESSING);
    }

    public function markAsPaid(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            $order->refresh();

            if ($order->status === OrderStatus::CANCELLED) {
                throw ValidationException::withMessages([
                    'order' => ['Impossible de valider le paiement d une commande annulee.'],
                ]);
            }

            if ($order->payment_status !== PaymentStatus::PAID) {
                $order->update([
                    'payment_status' => PaymentStatus::PAID,
                ]);
            }

            $invoice = $order->invoice ?: $this->createInitialInvoice($order);
            if ($invoice->status !== InvoiceStatus::PAID) {
                $invoice->update(['status' => InvoiceStatus::PAID]);
            }

            $this->createReceiptIfMissing($order);

            return $this->freshOrder($order);
        });
    }

    public function cancelOrder(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            $order->refresh();

            if ($order->status === OrderStatus::DELIVERED) {
                throw ValidationException::withMessages([
                    'order' => ['Une commande livree ne peut plus etre annulee.'],
                ]);
            }

            if ($order->status !== OrderStatus::CANCELLED) {
                $this->assertTransitionAllowed($order, OrderStatus::CANCELLED);
                $order->update(['status' => OrderStatus::CANCELLED]);
            }

            $invoice = $order->invoice ?: $this->createInitialInvoice($order);
            $invoice->update([
                'status' => $order->payment_status === PaymentStatus::PAID
                    ? InvoiceStatus::PAID
                    : InvoiceStatus::CANCELLED,
            ]);

            return $this->freshOrder($order);
        });
    }

    public function markAsDelivered(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            $order->refresh();

            if (! in_array($order->status, [OrderStatus::CONFIRMED, OrderStatus::PROCESSING], true)) {
                throw ValidationException::withMessages([
                    'order' => ['La livraison exige une commande confirmee ou en cours de traitement.'],
                ]);
            }

            $order->update(['status' => OrderStatus::DELIVERED]);

            return $this->freshOrder($order);
        });
    }

    public function allowedTransitions(): array
    {
        return self::ALLOWED_TRANSITIONS;
    }

    public function sendReceipt(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            $order = $this->freshOrder($order);

            if ($order->payment_status !== PaymentStatus::PAID) {
                throw ValidationException::withMessages([
                    'receipt' => ['Le recu ne peut etre envoye qu apres validation du paiement.'],
                ]);
            }

            $receipt = $order->receipt ?: $this->createReceiptIfMissing($order);

            if ($receipt->sent_at) {
                throw ValidationException::withMessages([
                    'receipt' => ['Le recu a deja ete envoye a ce client.'],
                ]);
            }

            Mail::to($order->user?->email)->send(new OrderReceiptMail($this->freshOrder($order)));

            $receipt->update([
                'sent_at' => now(),
            ]);

            return $this->freshOrder($order);
        });
    }

    private function transitionOrder(Order $order, OrderStatus $target): Order
    {
        return DB::transaction(function () use ($order, $target) {
            $order->refresh();
            $this->assertTransitionAllowed($order, $target);
            $order->update(['status' => $target]);

            return $this->freshOrder($order);
        });
    }

    private function assertTransitionAllowed(Order $order, OrderStatus $target): void
    {
        $currentStatus = $order->status instanceof OrderStatus
            ? $order->status->value
            : (string) $order->status;

        $allowedTargets = self::ALLOWED_TRANSITIONS[$currentStatus] ?? [];

        if (! in_array($target->value, $allowedTargets, true)) {
            throw ValidationException::withMessages([
                'order_status' => ["Transition interdite: {$currentStatus} -> {$target->value}."],
            ]);
        }
    }

    private function initialPaymentStatusFor(PaymentMethodCode $paymentMethod): PaymentStatus
    {
        return $paymentMethod === PaymentMethodCode::MOBILE_MONEY
            ? PaymentStatus::PENDING_VERIFICATION
            : PaymentStatus::UNPAID;
    }

    private function createInitialInvoice(Order $order): Invoice
    {
        return Invoice::firstOrCreate(
            ['order_id' => $order->id],
            [
                'number' => $this->nextDocumentNumber('INV'),
                'status' => InvoiceStatus::UNPAID,
                'issued_at' => now(),
            ]
        );
    }

    private function createReceiptIfMissing(Order $order): Receipt
    {
        return Receipt::firstOrCreate(
            ['order_id' => $order->id],
            [
                'number' => $this->nextDocumentNumber('RCPT'),
                'paid_at' => now(),
                'payment_method' => $order->payment_method,
            ]
        );
    }

    private function nextDocumentNumber(string $prefix): string
    {
        return sprintf('%s-%s-%s', $prefix, now()->format('YmdHis'), Str::upper(Str::random(6)));
    }

    private function freshOrder(Order $order): Order
    {
        return $order->fresh(['user', 'items', 'address', 'invoice', 'receipt']);
    }

    private function sendInvoiceIfNeeded(Order $order): void
    {
        $order = $this->freshOrder($order);
        $invoice = $order->invoice ?: $this->createInitialInvoice($order);

        if ($invoice->sent_at || empty($order->user?->email)) {
            return;
        }

        try {
            Mail::to($order->user->email)->send(
                new OrderInvoiceMail($order, $this->settingsService->getAboutPlatform())
            );

            $invoice->update([
                'sent_at' => now(),
            ]);
        } catch (Throwable $exception) {
            report($exception);
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
