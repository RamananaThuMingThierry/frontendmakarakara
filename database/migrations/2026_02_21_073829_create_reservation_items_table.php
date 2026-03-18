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
        Schema::create('reservation_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('reservation_id')->constrained('reservations')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('city_id')->constrained('cities')->cascadeOnDelete();

            $table->unsignedInteger('quantity');

            $table->timestamps();

            $table->index(['reservation_id']);
            $table->index(['product_id', 'city_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservation_items');
    }
};
