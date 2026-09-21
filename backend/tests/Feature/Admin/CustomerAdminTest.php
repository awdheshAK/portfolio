<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_admin_can_list_and_search_customers(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create(['name' => 'Priya Sharma', 'email' => 'priya@example.com']);
        User::factory()->create(['name' => 'Rahul Verma', 'email' => 'rahul@example.com']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/customers?search=priya');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.data'));
        $this->assertSame('Priya Sharma', $response->json('data.data.0.name'));
    }

    public function test_an_admin_can_view_a_customer_with_relation_counts(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/admin/customers/{$customer->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $customer->id)
            ->assertJsonPath('data.orders_count', 0)
            ->assertJsonPath('data.is_disabled', false);
    }

    public function test_an_admin_can_disable_and_restore_a_customer(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/customers/{$customer->id}")
            ->assertStatus(200);

        $this->assertSoftDeleted('users', ['id' => $customer->id]);

        $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/customers/{$customer->id}/restore")
            ->assertStatus(200)
            ->assertJsonPath('data.is_disabled', false);

        $this->assertDatabaseHas('users', ['id' => $customer->id, 'deleted_at' => null]);
    }

    public function test_an_admin_account_cannot_be_disabled_via_the_customer_endpoint(): void
    {
        $admin = User::factory()->admin()->create();
        $otherAdmin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/customers/{$otherAdmin->id}")
            ->assertStatus(422);
    }

    public function test_a_production_manager_cannot_access_customer_management(): void
    {
        $productionManager = User::factory()->productionManager()->create();
        $customer = User::factory()->create();

        $this->actingAs($productionManager, 'sanctum')->getJson('/api/v1/admin/customers')
            ->assertStatus(403);

        $this->actingAs($productionManager, 'sanctum')->getJson("/api/v1/admin/customers/{$customer->id}")
            ->assertStatus(403);
    }
}
