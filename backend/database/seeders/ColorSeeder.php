<?php

namespace Database\Seeders;

use App\Models\Color;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ColorSeeder extends Seeder
{
    public const COLORS = [
        ['name' => 'Black', 'hex' => '#000000'],
        ['name' => 'White', 'hex' => '#FFFFFF'],
        ['name' => 'Navy Blue', 'hex' => '#1B1F3B'],
        ['name' => 'Charcoal Grey', 'hex' => '#36454F'],
        ['name' => 'Maroon', 'hex' => '#800000'],
        ['name' => 'Forest Green', 'hex' => '#228B22'],
        ['name' => 'Royal Blue', 'hex' => '#4169E1'],
        ['name' => 'Mustard Yellow', 'hex' => '#E1AD01', 'price_delta_minor' => 5000],
    ];

    public function run(): void
    {
        foreach (self::COLORS as $color) {
            Color::query()->updateOrCreate(
                ['slug' => Str::slug($color['name'])],
                [
                    'name' => $color['name'],
                    'hex' => $color['hex'],
                    'price_delta_minor' => $color['price_delta_minor'] ?? 0,
                    'is_active' => true,
                ]
            );
        }
    }
}
