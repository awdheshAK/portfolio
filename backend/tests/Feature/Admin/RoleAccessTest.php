<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_admin_role_can_view_the_dashboard(): void
    {
        foreach (['admin', 'superAdmin', 'contentManager', 'orderManager', 'productionManager'] as $factoryState) {
            $user = User::factory()->{$factoryState}()->create();

            $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/dashboard')->assertStatus(200);
        }
    }

    public function test_a_customer_cannot_reach_any_admin_route(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer, 'sanctum')->getJson('/api/v1/admin/dashboard')->assertStatus(403);
        $this->actingAs($customer, 'sanctum')->getJson('/api/v1/admin/products')->assertStatus(403);
        $this->actingAs($customer, 'sanctum')->getJson('/api/v1/admin/orders')->assertStatus(403);
    }

    public function test_a_content_manager_cannot_manage_orders_or_coupons(): void
    {
        $contentManager = User::factory()->contentManager()->create();

        $this->actingAs($contentManager, 'sanctum')->getJson('/api/v1/admin/orders')->assertStatus(403);
        $this->actingAs($contentManager, 'sanctum')->getJson('/api/v1/admin/coupons')->assertStatus(403);
    }

    public function test_a_production_manager_can_view_orders_but_not_manage_products(): void
    {
        $productionManager = User::factory()->productionManager()->create();

        $this->actingAs($productionManager, 'sanctum')->getJson('/api/v1/admin/orders')->assertStatus(200);
        $this->actingAs($productionManager, 'sanctum')->postJson('/api/v1/admin/products', [
            'name' => 'Blocked Product',
            'base_price_minor' => 1000,
        ])->assertStatus(403);
    }
}
