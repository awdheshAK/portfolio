<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained('carts')->cascadeOnDelete();
            $table->string('type', 16); // product | custom
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->foreignId('garment_id')->nullable()->constrained('garments')->nullOnDelete();
            $table->json('design_configuration')->nullable();
            $table->string('name_snapshot')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->integer('unit_price_minor');
            $table->integer('total_price_minor');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};
