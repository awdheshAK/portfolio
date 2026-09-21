<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        Coupon::query()->updateOrCreate(
            ['code' => 'WELCOME10'],
            [
                'type' => Coupon::TYPE_PERCENTAGE,
                'value' => 10,
                'min_order_minor' => 50000,
                'max_discount_minor' => 50000,
                'usage_limit' => 1000,
                'used_count' => 0,
                'starts_at' => now()->subDay(),
                'expires_at' => now()->addYear(),
                'is_active' => true,
            ]
        );

        Coupon::query()->updateOrCreate(
            ['code' => 'FLAT200'],
            [
                'type' => Coupon::TYPE_FIXED,
                'value' => 20000,
                'min_order_minor' => 100000,
                'max_discount_minor' => null,
                'usage_limit' => 500,
                'used_count' => 0,
                'starts_at' => now()->subDay(),
                'expires_at' => now()->addMonths(6),
                'is_active' => true,
            ]
        );
    }
}
