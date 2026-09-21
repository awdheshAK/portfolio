<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PatchFactory extends Factory
{
    public function definition(): array
    {
        $name = ucfirst(fake()->unique()->word()).' Patch';

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 100000),
            'type' => 'woven',
            'price_minor' => 12000,
            'image_url' => 'https://placehold.co/200x200',
            'is_active' => true,
        ];
    }
}
