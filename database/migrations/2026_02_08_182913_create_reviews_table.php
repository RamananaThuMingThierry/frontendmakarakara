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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
                        // Relations
            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // Données avis
            $table->unsignedTinyInteger('rating'); // 1 à 5
            $table->text('comment')->nullable();

            // Modération admin
            $table->boolean('is_approved')->default(false);

            $table->timestamps();

            // Empêcher plusieurs avis du même user sur le même produit
            $table->unique(['product_id', 'user_id']);

            // Index pour performance
            $table->index(['product_id', 'rating']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
