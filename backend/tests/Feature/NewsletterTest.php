<?php

namespace Tests\Feature;

use App\Models\NewsletterSubscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NewsletterTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_can_subscribe_to_the_newsletter(): void
    {
        $response = $this->postJson('/api/v1/newsletter/subscribe', ['email' => 'sub@example.com']);

        $response->assertStatus(201)->assertJson(['success' => true]);
        $this->assertDatabaseHas('newsletter_subscribers', ['email' => 'sub@example.com']);
    }

    public function test_subscribing_twice_is_idempotent_and_does_not_error(): void
    {
        $this->postJson('/api/v1/newsletter/subscribe', ['email' => 'sub@example.com'])->assertStatus(201);
        $response = $this->postJson('/api/v1/newsletter/subscribe', ['email' => 'sub@example.com']);

        $response->assertStatus(201)->assertJson(['success' => true]);
        $this->assertSame(1, NewsletterSubscriber::where('email', 'sub@example.com')->count());
    }

    public function test_an_invalid_email_is_rejected(): void
    {
        $response = $this->postJson('/api/v1/newsletter/subscribe', ['email' => 'not-an-email']);

        $response->assertStatus(422)->assertJsonValidationErrors(['email']);
    }
}
