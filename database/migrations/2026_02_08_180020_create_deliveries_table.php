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
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();

            $table->string('delivery_status')->default('queued'); // queued, assigned, on_the_way, delivered, failed
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete(); // livreur

            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->string('proof_photo_url')->nullable();
            $table->string('proof_note')->nullable();

            $table->timestamps();

            $table->index(['delivery_status', 'assigned_to']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
