<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ColorFactory extends Factory
{
    public function definition(): array
    {
        $name = ucfirst(fake()->unique()->colorName());

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 100000),
            'hex' => fake()->hexColor(),
            'price_delta_minor' => 0,
            'is_active' => true,
        ];
    }
}
