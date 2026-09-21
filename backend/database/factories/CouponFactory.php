<?php

namespace Database\Factories;

use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;

class CouponFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('COUPON####')),
            'type' => Coupon::TYPE_PERCENTAGE,
            'value' => 10,
            'min_order_minor' => 0,
            'max_discount_minor' => null,
            'usage_limit' => null,
            'used_count' => 0,
            'starts_at' => null,
            'expires_at' => null,
            'is_active' => true,
        ];
    }
}
