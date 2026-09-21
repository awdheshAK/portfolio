<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PrintPositionFactory extends Factory
{
    public function definition(): array
    {
        $label = ucfirst(fake()->unique()->word()).' Print';

        return [
            'label' => $label,
            'slug' => Str::slug($label).'-'.fake()->unique()->numberBetween(1, 100000),
            'price_minor' => 15000,
            'is_active' => true,
        ];
    }
}
