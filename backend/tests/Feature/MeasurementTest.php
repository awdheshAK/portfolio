<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MeasurementTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_create_and_list_measurement_profiles(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/measurements', [
            'label' => 'Office Fit',
            'height' => 178,
            'chest' => 98,
        ])->assertStatus(201)->assertJsonPath('data.label', 'Office Fit');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/measurements');

        $response->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_a_user_cannot_create_two_profiles_with_the_same_label(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/measurements', ['label' => 'Gym Fit'])
            ->assertStatus(201);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/measurements', ['label' => 'Gym Fit']);

        $response->assertStatus(422)->assertJsonValidationErrors(['label']);
    }

    public function test_a_user_can_update_and_delete_their_own_profile(): void
    {
        $user = User::factory()->create();

        $create = $this->actingAs($user, 'sanctum')->postJson('/api/v1/measurements', ['label' => 'Gym Fit', 'waist' => 80]);
        $id = $create->json('data.id');

        $this->actingAs($user, 'sanctum')->putJson("/api/v1/measurements/{$id}", ['waist' => 82])
            ->assertStatus(200)->assertJsonPath('data.waist', 82);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/v1/measurements/{$id}")
            ->assertStatus(200);

        $this->assertSoftDeleted('measurements', ['id' => $id]);
    }

    public function test_a_user_cannot_modify_another_users_profile(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $create = $this->actingAs($owner, 'sanctum')->postJson('/api/v1/measurements', ['label' => 'Gym Fit']);
        $id = $create->json('data.id');

        $response = $this->actingAs($intruder, 'sanctum')->deleteJson("/api/v1/measurements/{$id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('measurements', ['id' => $id]);
    }

    public function test_measurements_require_authentication(): void
    {
        $this->getJson('/api/v1/measurements')->assertStatus(401);
    }
}
