<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use App\Models\Task;

class Phase44TeardownCutoverTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    /** @test T-44.1 Teardown verification */
    public function test_teardown_verification()
    {
        // First, purge and seed the demo database
        Artisan::call('demo:purge');
        Artisan::call('demo:seed');

        // Create a REAL user and a REAL department (without demo tags)
        $realDept = Department::create([
            'name' => 'Real Corporate',
            'description' => 'Not a demo department',
            'status' => 'active'
        ]);

        $realUser = User::create([
            'name' => 'Real CEO',
            'email' => 'ceo@realcompany.com',
            'password' => bcrypt('password123'),
            'company_id' => 1,
            'department_id' => $realDept->id,
            'is_demo' => false
        ]);

        // Run purge
        Artisan::call('demo:purge');

        // Assert demo users are gone (where is_demo = true)
        $this->assertEquals(0, User::where('is_demo', true)->count());

        // Assert real user is intact
        $this->assertDatabaseHas('users', [
            'email' => 'ceo@realcompany.com'
        ]);

        // Assert demo departments are gone (where demo_tag IS NOT NULL)
        $this->assertEquals(0, Department::whereNotNull('demo_tag')->count());

        // Assert real department is intact
        $this->assertDatabaseHas('departments', [
            'name' => 'Real Corporate'
        ]);

        // Assert no tasks remain
        $this->assertEquals(0, Task::count());

        // Assert AuditLog was created for teardown
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'demo_purge'
        ]);
    }

    /** @test T-44.2 Cutover rehearsal and T-44.3 Re-seed path */
    public function test_cutover_and_reseed()
    {
        // Start from empty
        // Create Real HR via "UI" simulation
        $realDept = Department::create([
            'name' => 'Real HR Dept',
            'status' => 'active'
        ]);

        $realHr = User::create([
            'name' => 'Real HR Admin',
            'email' => 'hradmin@realcompany.com',
            'password' => bcrypt('password123'),
            'department_id' => $realDept->id,
            'is_demo' => false
        ]);

        // Simulate clock in
        $response = $this->actingAs($realHr, 'sanctum')->postJson('/api/v1/attendance/clock-in', [
            'timestamp' => now()->toISOString()
        ]);
        // Might fail with validation or other constraints, but that's fine, we just want to ensure DB has NO demo residue.
        
        // At this point, NO demo_tag should exist in the database.
        $this->assertEquals(0, DB::table('departments')->whereNotNull('demo_tag')->count());

        // Now run demo:seed --fresh to simulate support/training requirement
        Artisan::call('demo:seed', ['--fresh' => true]);

        // Assert Real HR still exists
        $this->assertDatabaseHas('users', [
            'email' => 'hradmin@realcompany.com'
        ]);

        // Assert Demo HR was created
        $this->assertTrue(User::where('is_demo', true)->count() > 0);

        // Assert Demo Departments were created
        $this->assertTrue(Department::whereNotNull('demo_tag')->count() > 0);
    }
}
