<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('label');
            $table->decimal('height', 6, 2)->nullable();
            $table->decimal('chest', 6, 2)->nullable();
            $table->decimal('waist', 6, 2)->nullable();
            $table->decimal('hip', 6, 2)->nullable();
            $table->decimal('shoulder', 6, 2)->nullable();
            $table->decimal('sleeve_length', 6, 2)->nullable();
            $table->decimal('neck', 6, 2)->nullable();
            $table->decimal('inseam', 6, 2)->nullable();
            $table->decimal('outseam', 6, 2)->nullable();
            $table->decimal('garment_length', 6, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'label']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('measurements');
    }
};
