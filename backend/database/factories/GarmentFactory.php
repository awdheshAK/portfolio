<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class GarmentFactory extends Factory
{
    public function definition(): array
    {
        $name = 'Custom '.ucfirst(fake()->unique()->word()).' Garment';

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 100000),
            'description' => fake()->sentence(),
            'base_price_minor' => 45000,
            'image_layers' => ['base' => 'https://placehold.co/800x800'],
            'available_size_ids' => [],
            'available_color_ids' => [],
            'is_active' => true,
        ];
    }
}
