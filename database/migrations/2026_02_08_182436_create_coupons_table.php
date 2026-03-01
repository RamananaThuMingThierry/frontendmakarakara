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
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();                               // clé primaire auto‑incrémentée
            $table->string('code')->unique();           // code du coupon, doit être unique
            $table->enum('type', ['fixed', 'percent']); // type de réduction :
                                                        //   - fixed  = montant fixe
                                                        //   - percent = pourcentage
            $table->decimal('value', 12, 2);            // valeur de la remise (en fonction du type)
            $table->decimal('min_subtotal', 12, 2)      // montant minimum de commande requis
                ->default(0);

            $table->timestamp('starts_at')->nullable(); // date/heure de début de validité
            $table->timestamp('ends_at')->nullable();   // date/heure de fin de validité

            $table->integer('usage_limit')->nullable(); // nombre max d’utilisations (null = illimité)
            $table->integer('used_count')->default(0);  // compteur des fois utilisées

            $table->boolean('is_active')->default(true); // actif/inactif (désactiver un code)

            $table->timestamps();  
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
