<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AddressFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => 'Home',
            'full_name' => fake()->name(),
            'phone' => fake()->numerify('##########'),
            'line1' => fake()->streetAddress(),
            'line2' => null,
            'city' => fake()->city(),
            'state' => fake()->state(),
            'postal_code' => fake()->postcode(),
            'country' => 'IN',
            'is_default' => true,
        ];
    }
}
