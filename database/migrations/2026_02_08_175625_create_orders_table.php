<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->enum('status', ['pending','confirmed','packed','shipped','delivered','canceled'])->default('pending'); // pending, confirmed, packed, shipped, delivered, canceled
            $table->enum('payment_status', ['unpaid','paid','failed','refunded'])->default('unpaid'); // unpaid, paid, failed, refunded

            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('delivery_fee', 12, 2)->default(0);
            $table->decimal('total', 12, 2);

            $table->string('coupon_code')->nullable();

            // ✅ nouveau: moyen de paiement choisi (nullable tant que l'user n'a pas choisi)
            $table->foreignId('payment_method_id')
                ->nullable()
                ->constrained('payment_methods')
                ->nullOnDelete();

            // si tu veux garder une ref globale au niveau commande (optionnel)
            $table->string('payment_reference')->nullable();

            $table->text('notes')->nullable();

            $table->foreignId('city_id')->nullable()->constrained('cities')->nullOnDelete();
            $table->foreignId('address_id')->nullable()->constrained('addresses')->nullOnDelete();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['payment_method_id', 'payment_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
