<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_can_submit_the_contact_form(): void
    {
        $response = $this->postJson('/api/v1/contact', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'phone' => '9999999999',
            'message' => 'I have a question about bulk orders.',
        ]);

        $response->assertStatus(201)->assertJson(['success' => true]);

        $this->assertDatabaseHas('contact_submissions', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ]);
    }

    public function test_contact_form_requires_name_email_and_message(): void
    {
        $response = $this->postJson('/api/v1/contact', []);

        $response->assertStatus(422)->assertJsonValidationErrors(['name', 'email', 'message']);
    }

    public function test_contact_form_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/contact', [
                'name' => 'Jane Doe',
                'email' => "jane{$i}@example.com",
                'message' => 'Hello',
            ])->assertStatus(201);
        }

        $response = $this->postJson('/api/v1/contact', [
            'name' => 'Jane Doe',
            'email' => 'jane-extra@example.com',
            'message' => 'Hello',
        ]);

        $response->assertStatus(429);
    }
}
