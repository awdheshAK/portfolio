<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Optional canvas-placement coordinates for the frontend customizer.
        // Nullable: a position without coordinates simply isn't pre-anchored
        // on the canvas and the frontend falls back to its own default.
        Schema::table('customizer_print_positions', function (Blueprint $table) {
            $table->decimal('x', 6, 2)->nullable()->after('price_minor');
            $table->decimal('y', 6, 2)->nullable()->after('x');
            $table->string('anchor', 16)->nullable()->after('y');
        });

        Schema::table('customizer_embroidery_positions', function (Blueprint $table) {
            $table->decimal('x', 6, 2)->nullable()->after('price_minor');
            $table->decimal('y', 6, 2)->nullable()->after('x');
            $table->string('anchor', 16)->nullable()->after('y');
        });
    }

    public function down(): void
    {
        Schema::table('customizer_print_positions', function (Blueprint $table) {
            $table->dropColumn(['x', 'y', 'anchor']);
        });

        Schema::table('customizer_embroidery_positions', function (Blueprint $table) {
            $table->dropColumn(['x', 'y', 'anchor']);
        });
    }
};
