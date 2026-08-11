<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Support\Facades\Hash;

class PasswordPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_policy_enforced_at_change_password()
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        // Configure strict policy in settings
        \Illuminate\Support\Facades\DB::table('settings')->updateOrInsert(
            ['category' => 'security', 'key' => 'password.min_length'],
            ['value' => json_encode(12)]
        );
        \Illuminate\Support\Facades\DB::table('settings')->updateOrInsert(
            ['category' => 'security', 'key' => 'password.require_mixed'],
            ['value' => json_encode(true)]
        );
        \Illuminate\Support\Facades\DB::table('settings')->updateOrInsert(
            ['category' => 'security', 'key' => 'password.require_number'],
            ['value' => json_encode(true)]
        );
        \Illuminate\Support\Facades\DB::table('settings')->updateOrInsert(
            ['category' => 'security', 'key' => 'password.require_symbol'],
            ['value' => json_encode(true)]
        );

        $this->actingAs($user);

        // 1. Try a password that is too short
        $response = $this->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'password' => 'Short1!',
            'password_confirmation' => 'Short1!'
        ]);
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
        $this->assertStringContainsString('12 characters', $response->json('errors.password.0'));

        // 2. Try a password without mixed case
        $response = $this->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'password' => 'alllowercase123!',
            'password_confirmation' => 'alllowercase123!'
        ]);
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);

        // 3. Try a valid password
        $response = $this->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'password' => 'ValidP@ssw0rd123',
            'password_confirmation' => 'ValidP@ssw0rd123'
        ]);
        $response->assertStatus(200);

        $this->assertTrue(Hash::check('ValidP@ssw0rd123', $user->fresh()->password));
    }
}
