<?php

namespace Database\Seeders;

use App\Models\Color;
use App\Models\Garment;
use App\Models\Size;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class GarmentSeeder extends Seeder
{
    public const GARMENTS = [
        [
            'name' => 'Custom Crew Neck T-Shirt',
            'base_price_minor' => 45000,
            'description' => 'A blank crew-neck t-shirt canvas ready for your logo, print or embroidery.',
        ],
        [
            'name' => 'Custom Pullover Hoodie',
            'base_price_minor' => 95000,
            'description' => 'A cozy pullover hoodie base for full customization.',
        ],
        [
            'name' => 'Custom Polo Shirt',
            'base_price_minor' => 65000,
            'description' => 'A collared polo shirt base, perfect for team and corporate branding.',
        ],
    ];

    public function run(): void
    {
        $sizeIds = Size::query()->pluck('id')->all();
        $colorIds = Color::query()->pluck('id')->all();

        foreach (self::GARMENTS as $garment) {
            Garment::query()->updateOrCreate(
                ['slug' => Str::slug($garment['name'])],
                [
                    'name' => $garment['name'],
                    'description' => $garment['description'],
                    'base_price_minor' => $garment['base_price_minor'],
                    'image_layers' => [
                        'base' => 'https://placehold.co/800x800?text='.urlencode($garment['name']),
                    ],
                    'available_size_ids' => $sizeIds,
                    'available_color_ids' => $colorIds,
                    'is_active' => true,
                ]
            );
        }
    }
}
