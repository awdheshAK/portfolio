<?php

namespace Database\Seeders;

use App\Models\Size;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SizeSeeder extends Seeder
{
    public const SIZES = [
        ['label' => 'XS', 'price_delta_minor' => 0],
        ['label' => 'S', 'price_delta_minor' => 0],
        ['label' => 'M', 'price_delta_minor' => 0],
        ['label' => 'L', 'price_delta_minor' => 0],
        ['label' => 'XL', 'price_delta_minor' => 5000],
        ['label' => 'XXL', 'price_delta_minor' => 10000],
        ['label' => 'XXXL', 'price_delta_minor' => 15000],
    ];

    public function run(): void
    {
        foreach (self::SIZES as $index => $size) {
            Size::query()->updateOrCreate(
                ['slug' => Str::slug($size['label'])],
                [
                    'label' => $size['label'],
                    'price_delta_minor' => $size['price_delta_minor'],
                    'sort_order' => $index,
                    'is_active' => true,
                ]
            );
        }
    }
}
