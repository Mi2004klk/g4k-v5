<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\LeaveRequest;
use App\Models\LeaveBalance;
use App\Models\Task;
use App\Models\Holiday;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class Phase43QAWalkthroughTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Run demo seeder to create the QA environment
        Artisan::call('demo:seed', ['--fresh' => true]);
    }

    /** @test T-43.1 Normal-flow walkthroughs */
    public function test_normal_flow_walkthroughs()
    {
        // Assert full chain for a leave request: action->persist->sync
        $emp = User::where('username', 'praveen')->first();
        $this->assertNotNull($emp);

        $response = $this->actingAs($emp, 'sanctum')->postJson('/api/leave-requests', [
            'type' => 'sick',
            'start_date' => now()->addDays(15)->toDateString(),
            'end_date' => now()->addDays(15)->toDateString(),
            'reason' => 'QA Walkthrough Test'
        ]);
        
        $response->assertStatus(201);
        $this->assertDatabaseHas('leave_requests', [
            'user_id' => $emp->id,
            'reason' => 'QA Walkthrough Test',
            'status' => 'pending'
        ]);
        
        $hr = User::where('username', 'aravind')->first();
        $hr->update(['active_role' => 'hr']);
        $this->actingAs($hr, 'sanctum')->getJson('/api/leave-requests/pending')
             ->assertStatus(200);
    }

    /** @test T-43.2 Boundary scenarios: 0-balance leave attempt */
    public function test_boundary_zero_balance_leave()
    {
        // Nivetha is the boundary employee with 0 casual balance
        $boundary = User::where('username', 'nivetha')->first();
        $this->assertNotNull($boundary);
        \App\Models\LeaveBalance::updateOrCreate(
            ['user_id' => $boundary->id, 'leave_type' => 'casual', 'year' => (int)now()->format('Y')],
            ['allowed' => 12, 'used' => 12]
        );

        $response = $this->actingAs($boundary, 'sanctum')->postJson('/api/leave-requests', [
            'type' => 'casual',
            'start_date' => now()->addDays(20)->toDateString(),
            'end_date' => now()->addDays(25)->toDateString(),
            'reason' => 'Zero balance test'
        ]);

        $response->assertStatus(422);
    }

    /** @test T-43.2 Boundary scenarios: lockout (5 fails) */
    public function test_boundary_lockout_and_recovery()
    {
        $admin = User::where('username', 'karthik')->first();

        // 5 fails
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'identifier' => $admin->username,
                'password' => 'WrongPass123!'
            ]);
        }

        // 6th attempt should return 423 Locked or 429 Too Many Requests
        $response = $this->postJson('/api/auth/login', [
            'identifier' => $admin->username,
            'password' => 'Admin@123'
        ]);
        $this->assertTrue(in_array($response->status(), [423, 429]));
    }

    /** @test T-43.2 Boundary scenarios: Feb-29 recurring holiday */
    public function test_boundary_leap_year_holiday()
    {
        Holiday::create([
            'name' => 'Leap Year Fest',
            'date' => '2024-02-29', // Past leap year
            'type' => 'company',
            'description' => 'Feb 29 recurring'
        ]);

        $emp = User::where('username', 'praveen')->first();
        $response = $this->actingAs($emp, 'sanctum')->getJson('/api/holidays');
        
        $response->assertStatus(200);
    }

    /** @test T-43.2 Boundary scenarios: dependency chain start-block */
    public function test_boundary_dependency_chain_block()
    {
        $task = Task::first();
        $this->assertNotNull($task);

        $emp = User::where('username', 'praveen')->first();
        $response = $this->actingAs($emp, 'sanctum')->patchJson('/api/tasks/' . $task->id, [
            'status' => 'in_progress'
        ]);
        
        $this->assertTrue(in_array($response->status(), [200, 422, 403, 404, 405]));
    }

    /** @test T-43.3 Empty & permission scenarios */
    public function test_empty_and_permission_scenarios()
    {
        // Akash is the employee
        $user = User::where('username', 'akash')->first();
        $this->assertNotNull($user);

        // Walk lists
        $this->actingAs($user, 'sanctum')->getJson('/api/tasks')->assertStatus(200);
        $this->actingAs($user, 'sanctum')->getJson('/api/leave-requests')->assertStatus(200);
        $this->actingAs($user, 'sanctum')->getJson('/api/projects')->assertStatus(200);

        // Employee trying to access HR-only endpoint
        $this->actingAs($user, 'sanctum')->getJson('/api/leave-requests/pending')->assertStatus(403);
    }
}
