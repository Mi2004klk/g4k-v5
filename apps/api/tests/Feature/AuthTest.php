<?php

namespace Tests\Feature;

use Tests\TestCase;

use App\Models\User;
use App\Models\RoleAssignment;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_success()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'identifier' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['token', 'user', 'active_role']);
    }

    public function test_login_lockout()
    {
        $user = User::factory()->create([
            'email' => 'lockout@example.com',
            'password' => bcrypt('password123'),
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'identifier' => 'lockout@example.com',
                'password' => 'wrong',
            ]);
        }

        $response = $this->postJson('/api/auth/login', [
            'identifier' => 'lockout@example.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(423); // Account locked
    }
}
