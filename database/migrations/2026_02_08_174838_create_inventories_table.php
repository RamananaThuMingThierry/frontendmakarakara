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
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('city_id')->constrained()->cascadeOnDelete();

            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('compare_price', 12, 2)->default(0);

            $table->integer('quantity')->default(0);
            $table->unsignedInteger('reserved_quantity')->default(0); // réservé

            $table->integer('min_stock')->default(0); // seuil minimum (low stock)
            $table->boolean('is_available')->default(true);
            $table->enum('status', ['ok','low','out_of_stock'])->default('ok'); // Normal, Faible, Rupture
            $table->timestamps();

            $table->unique(['product_id', 'city_id']);
            $table->index(['city_id', 'quantity']);
            $table->index(['product_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
