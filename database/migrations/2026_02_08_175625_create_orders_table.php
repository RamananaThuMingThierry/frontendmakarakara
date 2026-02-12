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

            $table->string('status')->default('pending'); // pending, confirmed, packed, shipped, delivered, canceled
            $table->string('payment_status')->default('unpaid'); // unpaid, paid, failed, refunded

            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('delivery_fee', 12, 2)->default(0);
            $table->decimal('total', 12, 2);

            $table->string('coupon_code')->nullable();
            $table->enum('payment_method', ['cash', 'mobile_money'])->default('cash');
            $table->string('payment_reference')->nullable(); // ex: ref mobile money

            $table->text('notes')->nullable();

            // Option: ville choisie pour la commande (si tu veux)
            $table->foreignId('city_id')->nullable()->constrained('cities')->nullOnDelete();

            // Adresse livraison choisie
            $table->foreignId('address_id')->nullable()->constrained('addresses')->nullOnDelete();

            $table->timestamps();

            $table->index(['user_id', 'status']);
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
