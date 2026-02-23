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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            $table->foreignId('city_from_id')->nullable()->constrained('cities')->nullOnDelete();
            $table->foreignId('city_to_id')->nullable()->constrained('cities')->nullOnDelete();

            $table->string('type'); // in, out, adjust, return
            $table->integer('quantity');
            $table->string('reason')->nullable(); // sale, correction...
            $table->text('note')->nullable();

            // Référence (commande, inventaire, etc.)
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->index(['reference_type', 'reference_id']);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['product_id', 'type']);
            $table->index(['city_from_id', 'city_to_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
