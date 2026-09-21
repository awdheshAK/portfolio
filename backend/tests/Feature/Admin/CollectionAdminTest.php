<?php

namespace Tests\Feature\Admin;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_admin_can_create_a_collection_with_products(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/collections', [
            'name' => 'Summer Collection',
            'description' => 'Light fabrics for warm weather.',
            'is_active' => true,
            'product_ids' => [$product->id],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Summer Collection')
            ->assertJsonPath('data.product_ids.0', $product->id);
    }

    public function test_an_admin_can_update_and_delete_a_collection(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/collections', [
            'name' => 'Winter Collection',
        ])->assertStatus(201);

        $collectionId = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/collections')
            ->json('data.0.id');

        $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/collections/{$collectionId}", [
            'is_active' => false,
        ])->assertStatus(200)->assertJsonPath('data.is_active', false);

        $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/collections/{$collectionId}")
            ->assertStatus(200);
    }

    public function test_a_content_manager_can_manage_collections_but_an_order_manager_cannot(): void
    {
        $contentManager = User::factory()->contentManager()->create();
        $orderManager = User::factory()->orderManager()->create();

        $this->actingAs($contentManager, 'sanctum')->postJson('/api/v1/admin/collections', [
            'name' => 'Content Manager Collection',
        ])->assertStatus(201);

        $this->actingAs($orderManager, 'sanctum')->postJson('/api/v1/admin/collections', [
            'name' => 'Should Be Blocked',
        ])->assertStatus(403);
    }
}
