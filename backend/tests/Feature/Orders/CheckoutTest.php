<?php

namespace Tests\Feature\Orders;

use App\Models\Address;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\RazorpayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function fakeRazorpay(): void
    {
        $this->mock(RazorpayService::class, function ($mock) {
            $mock->shouldReceive('createOrder')
                ->andReturn([
                    'id' => 'order_fake123',
                    'amount' => 100000,
                    'currency' => 'INR',
                    'status' => 'created',
                ]);
        });
    }

    public function test_a_user_can_checkout_from_their_cart(): void
    {
        $this->fakeRazorpay();

        $user = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $user->id]);

        $product = Product::factory()->create(['base_price_minor' => 50000]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'stock' => 10]);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/items', [
            'type' => 'product',
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ])->assertStatus(200);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/orders/checkout', [
            'shipping_address_id' => $address->id,
            'billing_same_as_shipping' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.razorpay_order_id', 'order_fake123')
            ->assertJsonPath('data.amount_minor', 100000)
            ->assertJsonPath('data.order.status', 'pending_payment');

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'total_minor' => 100000,
            'status' => 'pending_payment',
        ]);

        $this->assertDatabaseHas('order_items', [
            'product_variant_id' => $variant->id,
            'quantity' => 2,
            'total_price_minor' => 100000,
        ]);

        $this->assertDatabaseHas('payments', [
            'gateway_order_id' => 'order_fake123',
            'status' => 'created',
        ]);

        // Stock should be decremented and the cart emptied.
        $this->assertSame(8, $variant->fresh()->stock);

        $cartResponse = $this->actingAs($user, 'sanctum')->getJson('/api/v1/cart');
        $cartResponse->assertJsonCount(0, 'data.items');
    }

    public function test_checkout_fails_with_an_empty_cart(): void
    {
        $this->fakeRazorpay();

        $user = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/orders/checkout', [
            'shipping_address_id' => $address->id,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['cart']);
    }

    public function test_checkout_fails_when_stock_is_insufficient(): void
    {
        $this->fakeRazorpay();

        $user = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $user->id]);

        $product = Product::factory()->create(['base_price_minor' => 50000]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'stock' => 1]);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/items', [
            'type' => 'product',
            'product_variant_id' => $variant->id,
            'quantity' => 1,
        ])->assertStatus(200);

        // Someone else buys the last unit between cart-add and checkout.
        $variant->update(['stock' => 0]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/orders/checkout', [
            'shipping_address_id' => $address->id,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['cart']);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_checkout_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/orders/checkout', [
            'shipping_address' => [
                'full_name' => 'Guest',
                'phone' => '9999999999',
                'line1' => 'Line 1',
                'city' => 'City',
                'state' => 'State',
                'postal_code' => '000000',
            ],
        ]);

        $response->assertStatus(401);
    }
}
