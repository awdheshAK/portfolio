<?php

namespace Database\Seeders;

use App\Models\Fabric;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class FabricSeeder extends Seeder
{
    public const FABRICS = [
        ['name' => 'Cotton', 'price_delta_minor' => 0, 'description' => 'Breathable 100% cotton, soft against the skin.'],
        ['name' => 'Polyester Blend', 'price_delta_minor' => 15000, 'description' => 'Durable poly-cotton blend that resists wrinkles.'],
        ['name' => 'Fleece', 'price_delta_minor' => 35000, 'description' => 'Warm brushed fleece, ideal for winter wear.'],
        ['name' => 'Dri-Fit', 'price_delta_minor' => 25000, 'description' => 'Moisture-wicking performance fabric for workouts.'],
        ['name' => 'Linen', 'price_delta_minor' => 45000, 'description' => 'Lightweight, breathable premium linen.'],
    ];

    public function run(): void
    {
        foreach (self::FABRICS as $fabric) {
            Fabric::query()->updateOrCreate(
                ['slug' => Str::slug($fabric['name'])],
                [
                    'name' => $fabric['name'],
                    'description' => $fabric['description'],
                    'price_delta_minor' => $fabric['price_delta_minor'],
                    'is_active' => true,
                ]
            );
        }
    }
}
