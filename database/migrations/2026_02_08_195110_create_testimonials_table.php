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
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            
            $table->string('name');              // nom de la fille
            $table->string('photo_url')->nullable(); // photo
            $table->string('city')->nullable();  // ex: Tana
            $table->string('product_used')->nullable(); // ex: Huile X (optionnel)

            $table->unsignedTinyInteger('rating')->nullable(); // 1-5 (optionnel)
            $table->text('message');             // témoignage

            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimonials');
    }
};
