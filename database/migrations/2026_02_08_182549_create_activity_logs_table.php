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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            // Qui a fait l'action
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Action structurée pour UI (couleurs) + filtrage
            $table->string('action');   // create, update, view, delete, error...
            $table->enum('color', ['success', 'primary', 'info', 'warning', 'danger'])->default('info'); // success, info, warning, error

            /**
             * create => success
             * update => primary
             * delete => danger
             */

            // Cible (morph style)
            $table->string('entity_type')->nullable(); 
            $table->unsignedBigInteger('entity_id')->nullable();

            // Contexte request
            $table->string('method')->nullable();     // GET, POST...
            $table->string('url')->nullable();
            $table->string('route')->nullable();

            // Résultat / erreurs
            $table->unsignedSmallInteger('status_code')->nullable(); // 200, 422, 500...
            $table->text('message')->nullable(); // texte lisible

            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['entity_type', 'entity_id']);
            $table->index(['user_id', 'created_at']);
            $table->index(['action', 'created_at']);
            $table->index(['color', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
