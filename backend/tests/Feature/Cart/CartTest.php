<?php

namespace Tests\Feature\Cart;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    protected function makeVariant(int $basePrice = 50000, int $delta = 0, int $stock = 10): ProductVariant
    {
        $product = Product::factory()->create(['base_price_minor' => $basePrice]);

        return ProductVariant::factory()->create([
            'product_id' => $product->id,
            'price_delta_minor' => $delta,
            'stock' => $stock,
        ]);
    }

    public function test_guest_can_add_a_product_to_the_cart_with_a_guest_token(): void
    {
        $variant = $this->makeVariant(59900);

        $response = $this->withHeader('X-Guest-Cart-Token', 'guest-token-123')
            ->postJson('/api/v1/cart/items', [
                'type' => 'product',
                'product_variant_id' => $variant->id,
                'quantity' => 2,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.subtotal_minor', 119800)
            ->assertJsonPath('data.total_minor', 119800)
            ->assertJsonCount(1, 'data.items');
    }

    public function test_authenticated_user_can_add_item_and_it_persists_to_their_cart(): void
    {
        $user = User::factory()->create();
        $variant = $this->makeVariant(40000);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/items', [
            'type' => 'product',
            'product_variant_id' => $variant->id,
            'quantity' => 1,
        ])->assertStatus(200);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/cart');

        $response->assertStatus(200)->assertJsonCount(1, 'data.items');
    }

    public function test_adding_the_same_variant_twice_merges_quantity(): void
    {
        $user = User::factory()->create();
        $variant = $this->makeVariant(10000);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/items', [
            'type' => 'product',
            'product_variant_id' => $variant->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/items', [
            'type' => 'product',
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ]);

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.quantity', 3);
    }

    public function test_adding_more_than_available_stock_fails(): void
    {
        $user = User::factory()->create();
        $variant = $this->makeVariant(10000, 0, 2);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/items', [
            'type' => 'product',
            'product_variant_id' => $variant->id,
            'quantity' => 5,
        ]);

        $response->assertStatus(422);
    }

    public function test_a_user_can_update_a_cart_item_quantity(): void
    {
        $user = User::factory()->create();
        $variant = $this->makeVariant(20000);

        $add = $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/items', [
            'type' => 'product',
            'product_variant_id' => $variant->id,
            'quantity' => 1,
        ]);

        $itemId = $add->json('data.items.0.id');

        $response = $this->actingAs($user, 'sanctum')->patchJson("/api/v1/cart/items/{$itemId}", [
            'quantity' => 4,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.items.0.quantity', 4)
            ->assertJsonPath('data.subtotal_minor', 80000);
    }

    public function test_a_user_can_remove_a_cart_item(): void
    {
        $user = User::factory()->create();
        $variant = $this->makeVariant(20000);

        $add = $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/items', [
            'type' => 'product',
            'product_variant_id' => $variant->id,
            'quantity' => 1,
        ]);

        $itemId = $add->json('data.items.0.id');

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/v1/cart/items/{$itemId}");

        $response->assertStatus(200)->assertJsonCount(0, 'data.items');
    }

    public function test_cart_endpoints_require_auth_or_guest_token(): void
    {
        $variant = $this->makeVariant();

        $response = $this->postJson('/api/v1/cart/items', [
            'type' => 'product',
            'product_variant_id' => $variant->id,
            'quantity' => 1,
        ]);

        $response->assertStatus(422);
    }
}
