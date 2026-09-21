<?php

namespace Tests\Feature\Cart;

use App\Models\Coupon;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponTest extends TestCase
{
    use RefreshDatabase;

    protected function cartWithSubtotal(User $user, int $subtotalMinor): void
    {
        $product = Product::factory()->create(['base_price_minor' => $subtotalMinor]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'stock' => 10]);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/items', [
            'type' => 'product',
            'product_variant_id' => $variant->id,
            'quantity' => 1,
        ])->assertStatus(200);
    }

    public function test_a_valid_coupon_can_be_applied(): void
    {
        $user = User::factory()->create();
        $this->cartWithSubtotal($user, 100000);

        Coupon::factory()->create([
            'code' => 'VALID10',
            'type' => Coupon::TYPE_PERCENTAGE,
            'value' => 10,
            'min_order_minor' => 0,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/coupon', ['code' => 'VALID10']);

        $response->assertStatus(200)
            ->assertJsonPath('data.discount_minor', 10000)
            ->assertJsonPath('data.total_minor', 90000);
    }

    public function test_an_expired_coupon_is_rejected(): void
    {
        $user = User::factory()->create();
        $this->cartWithSubtotal($user, 100000);

        Coupon::factory()->create([
            'code' => 'EXPIRED10',
            'expires_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/coupon', ['code' => 'EXPIRED10']);

        $response->assertStatus(422)->assertJsonValidationErrors(['code']);
    }

    public function test_a_coupon_below_minimum_order_is_rejected(): void
    {
        $user = User::factory()->create();
        $this->cartWithSubtotal($user, 10000);

        Coupon::factory()->create([
            'code' => 'BIGORDER',
            'min_order_minor' => 500000,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/coupon', ['code' => 'BIGORDER']);

        $response->assertStatus(422)->assertJsonValidationErrors(['code']);
    }

    public function test_a_coupon_at_its_usage_limit_is_rejected(): void
    {
        $user = User::factory()->create();
        $this->cartWithSubtotal($user, 100000);

        Coupon::factory()->create([
            'code' => 'MAXEDOUT',
            'usage_limit' => 5,
            'used_count' => 5,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/coupon', ['code' => 'MAXEDOUT']);

        $response->assertStatus(422)->assertJsonValidationErrors(['code']);
    }

    public function test_an_unknown_coupon_code_is_rejected(): void
    {
        $user = User::factory()->create();
        $this->cartWithSubtotal($user, 100000);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/coupon', ['code' => 'DOESNOTEXIST']);

        $response->assertStatus(422)->assertJsonValidationErrors(['code']);
    }

    public function test_a_coupon_can_be_removed(): void
    {
        $user = User::factory()->create();
        $this->cartWithSubtotal($user, 100000);

        Coupon::factory()->create(['code' => 'REMOVEME', 'min_order_minor' => 0]);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/coupon', ['code' => 'REMOVEME'])
            ->assertStatus(200);

        $response = $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/cart/coupon');

        $response->assertStatus(200)->assertJsonPath('data.coupon', null);
    }
}
