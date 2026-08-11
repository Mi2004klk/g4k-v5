<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Since we are not using Mockery for basic feature testing, we just let it run against test DB.
    }

    public function test_user_can_login_with_email()
    {
        $user = User::factory()->create([
            'email' => 'test@games4king.com',
            'password' => Hash::make('Password123!'),
            'must_change_password' => false,
            'onboarded_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'identifier' => 'test@games4king.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['token', 'user', 'active_role']);
    }

    public function test_login_validation_failure()
    {
        $response = $this->postJson('/api/auth/login', [
            'identifier' => '',
            'password' => '',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['identifier', 'password']);
    }

    public function test_login_rate_limiting_lockout()
    {
        $user = User::factory()->create([
            'email' => 'locked@games4king.com',
            'password' => Hash::make('Password123!'),
        ]);

        // Hit limit (5 attempts)
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'identifier' => 'locked@games4king.com',
                'password' => 'WrongPassword!',
            ]);
        }

        // 6th attempt should be 423 Locked
        $response = $this->postJson('/api/auth/login', [
            'identifier' => 'locked@games4king.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(423)
                 ->assertJsonStructure(['message', 'retry_after']);
    }

    public function test_force_password_change_middleware()
    {
        $user = User::factory()->create([
            'must_change_password' => true,
            'onboarded_at' => now(),
        ]);

        $token = $user->createToken('test', ['role:employee'])->plainTextToken;

        \App\Models\Setting::create([
            'category' => 'security',
            'key' => 'force_password_change',
            'value' => 'true'
        ]);

        // Trying to access a protected route
        $response = $this->withToken($token)->getJson('/api/profile');

        $response->assertStatus(403)
                 ->assertJson(['must_change_password' => true]);
    }

    public function test_force_onboarding_middleware()
    {
        $user = User::factory()->create([
            'must_change_password' => false,
            'onboarded_at' => null,
        ]);

        $token = $user->createToken('test')->plainTextToken;

        // Trying to access a protected route
        $response = $this->withToken($token)->getJson('/api/profile');

        $response->assertStatus(403)
                 ->assertJson(['needs_onboarding' => true]);
    }

    public function test_forgot_password_flow()
    {
        $user = User::factory()->create([
            'email' => 'forgot@games4king.com',
        ]);

        $response = $this->postJson('/api/auth/forgot-password', [
            'identifier' => 'forgot@games4king.com',
            'channel' => 'smtp'
        ]);

        $response->assertStatus(202);

        // Verify token created
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => $user->email,
        ]);
    }

    public function test_reset_password_flow()
    {
        $user = User::factory()->create([
            'email' => 'reset@games4king.com',
            'password' => Hash::make('OldPassword123!')
        ]);

        $token = 'random-token-123';

        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'identifier' => 'reset@games4king.com',
            'token' => $token,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password));
    }

    public function test_change_password_clears_must_change_flag()
    {
        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123!'),
            'must_change_password' => true,
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/auth/change-password', [
            'current_password' => 'OldPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);

        $response->assertStatus(200);
        $this->assertFalse($user->fresh()->must_change_password);
        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password));
    }
}
