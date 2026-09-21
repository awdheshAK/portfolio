<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_queues_a_reset_notification_for_an_existing_user(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'known@example.com']);

        $response = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'known@example.com']);

        $response->assertStatus(200)->assertJson(['success' => true]);

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_forgot_password_responds_identically_for_an_unknown_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'unknown@example.com']);

        $response->assertStatus(200)->assertJson([
            'success' => true,
            'message' => 'If an account exists for that email, a password reset link has been sent.',
        ]);

        Notification::assertNothingSent();
    }

    public function test_a_user_can_reset_their_password_with_a_valid_token(): void
    {
        $user = User::factory()->create(['email' => 'reset@example.com', 'password' => 'OldPassword123']);
        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'reset@example.com',
            'password' => 'BrandNewPassword123',
            'password_confirmation' => 'BrandNewPassword123',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);

        $this->assertTrue(Hash::check('BrandNewPassword123', $user->fresh()->password));
    }

    public function test_reset_password_fails_with_an_invalid_token(): void
    {
        User::factory()->create(['email' => 'reset2@example.com']);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'not-a-real-token',
            'email' => 'reset2@example.com',
            'password' => 'BrandNewPassword123',
            'password_confirmation' => 'BrandNewPassword123',
        ]);

        $response->assertStatus(422)->assertJson(['success' => false]);
    }
}
