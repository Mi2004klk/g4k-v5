<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\RoleAssignment;
use App\Models\LoginAttempt;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_success_by_email()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'username' => 'testuser',
            'employee_id' => 'EMP001',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'identifier' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['token', 'user', 'active_role']);
        $this->assertDatabaseHas('login_attempts', [
            'user_id' => $user->id,
            'success' => true,
        ]);
    }

    public function test_login_success_by_username()
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'username' => 'karthikuser',
            'employee_id' => 'EMP002',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'identifier' => 'karthikuser',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['token', 'user', 'active_role']);
    }

    public function test_login_success_by_employee_id()
    {
        $user = User::factory()->create([
            'email' => 'emp@example.com',
            'username' => 'empuser',
            'employee_id' => 'G4K007',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'identifier' => 'G4K007',
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
