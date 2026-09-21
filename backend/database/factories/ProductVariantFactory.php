<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductVariantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'color_id' => null,
            'size_id' => null,
            'sku' => strtoupper(fake()->unique()->bothify('SKU-####-????')),
            'price_delta_minor' => 0,
            'stock' => 20,
            'is_active' => true,
        ];
    }
}
