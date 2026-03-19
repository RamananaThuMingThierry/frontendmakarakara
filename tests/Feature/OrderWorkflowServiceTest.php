<?php

namespace Tests\Feature;

use App\Enums\InvoiceStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethodCode;
use App\Enums\PaymentStatus;
use App\Mail\OrderInvoiceMail;
use App\Mail\OrderReceiptMail;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class OrderWorkflowServiceTest extends TestCase
{
    use RefreshDatabase;

    private OrderWorkflowService $service;
    private User $user;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();

        $this->service = app(OrderWorkflowService::class);
        $this->user = User::factory()->create();

        $category = Category::create([
            'name' => 'Categorie test',
            'slug' => 'categorie-test',
            'is_active' => true,
        ]);

        $brand = Brand::create([
            'name' => 'Brand test',
            'slug' => 'brand-test',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'name' => 'Produit test',
            'slug' => 'produit-test',
            'price' => 10000,
            'compare_price' => 12000,
            'sku' => 'SKU-TEST-001',
            'barcode' => 'BAR-TEST-001',
            'is_active' => true,
        ]);
    }

    public function test_create_order_cash_sets_payment_status_to_unpaid(): void
    {
        $order = $this->service->createOrder($this->user, $this->payload(PaymentMethodCode::CASH));

        $this->assertSame(OrderStatus::PENDING, $order->status);
        $this->assertSame(PaymentMethodCode::CASH, $order->payment_method);
        $this->assertSame(PaymentStatus::UNPAID, $order->payment_status);
        $this->assertNotNull($order->invoice);
        $this->assertSame(InvoiceStatus::UNPAID, $order->invoice->status);
        $this->assertNotNull($order->invoice->sent_at);
        Mail::assertSent(OrderInvoiceMail::class, 1);
    }

    public function test_create_order_mobile_money_sets_payment_status_to_pending_verification(): void
    {
        $order = $this->service->createOrder($this->user, $this->payload(PaymentMethodCode::MOBILE_MONEY));

        $this->assertSame(PaymentStatus::PENDING_VERIFICATION, $order->payment_status);
        $this->assertSame(PaymentMethodCode::MOBILE_MONEY, $order->payment_method);
    }

    public function test_mark_as_paid_sets_paid_and_generates_receipt(): void
    {
        $order = $this->service->createOrder($this->user, $this->payload(PaymentMethodCode::CASH));
        $paidOrder = $this->service->markAsPaid($order);

        $this->assertSame(PaymentStatus::PAID, $paidOrder->payment_status);
        $this->assertNotNull($paidOrder->receipt);
        $this->assertSame(PaymentMethodCode::CASH, $paidOrder->receipt->payment_method);
        $this->assertSame(InvoiceStatus::PAID, $paidOrder->invoice->status);
    }

    public function test_mark_as_paid_does_not_generate_second_receipt(): void
    {
        $order = $this->service->createOrder($this->user, $this->payload(PaymentMethodCode::CASH));

        $this->service->markAsPaid($order);
        $this->service->markAsPaid($order->fresh());

        $this->assertDatabaseCount('receipts', 1);
    }

    public function test_cancel_order_blocks_when_delivered(): void
    {
        $order = $this->service->createOrder($this->user, $this->payload(PaymentMethodCode::CASH));
        $order = $this->service->confirmOrder($order);
        $order = $this->service->markAsDelivered($order);

        $this->expectException(ValidationException::class);

        $this->service->cancelOrder($order);
    }

    public function test_mark_as_delivered_does_not_create_new_invoice(): void
    {
        $order = $this->service->createOrder($this->user, $this->payload(PaymentMethodCode::CASH));
        $invoiceNumber = $order->invoice->number;

        $order = $this->service->confirmOrder($order);
        $order = $this->service->markAsDelivered($order);

        $this->assertDatabaseCount('invoices', 1);
        $this->assertSame($invoiceNumber, $order->invoice->number);
    }

    public function test_cancel_order_keeps_history_even_if_payment_is_already_done(): void
    {
        $order = $this->service->createOrder($this->user, $this->payload(PaymentMethodCode::MOBILE_MONEY));
        $order = $this->service->markAsPaid($order);
        $cancelledOrder = $this->service->cancelOrder($order);

        $this->assertSame(OrderStatus::CANCELLED, $cancelledOrder->status);
        $this->assertSame(PaymentStatus::PAID, $cancelledOrder->payment_status);
        $this->assertNotNull($cancelledOrder->invoice);
        $this->assertNotNull($cancelledOrder->receipt);
        $this->assertSame(InvoiceStatus::PAID, $cancelledOrder->invoice->status);
    }

    public function test_send_receipt_sends_mail_once_after_payment(): void
    {
        $order = $this->service->createOrder($this->user, $this->payload(PaymentMethodCode::MOBILE_MONEY));
        $order = $this->service->markAsPaid($order);
        $updatedOrder = $this->service->sendReceipt($order);

        Mail::assertSent(OrderReceiptMail::class, 1);
        $this->assertNotNull($updatedOrder->receipt);
        $this->assertNotNull($updatedOrder->receipt->sent_at);

        $this->expectException(ValidationException::class);
        $this->service->sendReceipt($updatedOrder);
    }

    public function test_create_order_sends_invoice_once(): void
    {
        $order = $this->service->createOrder($this->user, $this->payload(PaymentMethodCode::CASH));

        Mail::assertSent(OrderInvoiceMail::class, 1);
        $this->assertNotNull($order->invoice);
        $this->assertNotNull($order->invoice->sent_at);
    }

    private function payload(PaymentMethodCode $paymentMethod): array
    {
        return [
            'coupon_code' => null,
            'payment_method' => $paymentMethod->value,
            'notes' => 'Commande test',
            'address' => [
                'full_name' => 'Client Test',
                'phone' => '0340000000',
                'address_line1' => 'Adresse test',
                'address_line2' => null,
                'city_name' => 'Antananarivo',
                'region' => 'Analamanga',
                'latitude' => null,
                'longitude' => null,
            ],
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                ],
            ],
        ];
    }
}
