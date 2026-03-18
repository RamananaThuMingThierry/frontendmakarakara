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
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('cart_id')->nullable()->constrained('carts')->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();

            $table->enum('status', ['active', 'released', 'consumed', 'expired'])->default('active');
            $table->timestamp('expires_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('reserved_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamp('expired_at')->nullable();

            $table->string('release_reason')->nullable();

            $table->timestamps();

            $table->index(['status', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
