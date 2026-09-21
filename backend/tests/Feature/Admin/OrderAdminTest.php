<?php

namespace Tests\Feature\Admin;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function makeOrder(User $customer): Order
    {
        return Order::create([
            'order_number' => 'ORD-TEST-1',
            'user_id' => $customer->id,
            'status' => 'payment_confirmed',
            'subtotal_minor' => 100000,
            'discount_minor' => 0,
            'shipping_minor' => 0,
            'total_minor' => 100000,
            'currency' => 'INR',
            'shipping_address' => ['full_name' => 'Test Customer', 'line1' => '1 Test St', 'city' => 'Testville'],
            'placed_at' => now(),
        ]);
    }

    public function test_admin_order_detail_includes_customer_and_payment_info(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create(['name' => 'Priya Sharma', 'email' => 'priya@example.com']);
        $order = $this->makeOrder($customer);
        Payment::create([
            'order_id' => $order->id,
            'gateway' => 'razorpay',
            'gateway_order_id' => 'order_test123',
            'status' => 'captured',
            'amount_minor' => 100000,
            'currency' => 'INR',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/admin/orders/{$order->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.user.email', 'priya@example.com')
            ->assertJsonPath('data.payments.0.gateway', 'razorpay')
            ->assertJsonPath('data.payments.0.status', 'captured')
            ->assertJsonMissingPath('data.payments.0.raw_response');
    }

    public function test_an_order_manager_can_update_order_status(): void
    {
        $orderManager = User::factory()->orderManager()->create();
        $order = $this->makeOrder(User::factory()->create());

        $this->actingAs($orderManager, 'sanctum')
            ->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'shipped'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'shipped');
    }
}
