<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        $name = ucfirst(fake()->unique()->words(3, true));

        return [
            'category_id' => null,
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 1000000),
            'description' => fake()->paragraph(),
            'short_description' => fake()->sentence(),
            'base_price_minor' => fake()->numberBetween(29900, 199900),
            'is_customizable' => false,
            'is_active' => true,
            'is_featured' => false,
            'rating_avg' => 0,
            'rating_count' => 0,
        ];
    }
}
