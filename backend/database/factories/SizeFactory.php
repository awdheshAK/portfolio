<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class SizeFactory extends Factory
{
    public function definition(): array
    {
        $label = fake()->unique()->randomElement(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);

        return [
            'label' => $label,
            'slug' => Str::slug($label).'-'.fake()->unique()->numberBetween(1, 100000),
            'price_delta_minor' => 0,
            'sort_order' => 0,
            'is_active' => true,
        ];
    }
}
