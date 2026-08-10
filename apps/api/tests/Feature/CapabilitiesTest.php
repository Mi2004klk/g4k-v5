<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\RoleAssignment;

class CapabilitiesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\DB::table('capabilities')->insert([
            ['key' => 'audit.view', 'description' => 'View Audit Logs', 'group' => 'System'],
            ['key' => '*', 'description' => 'All Capabilities', 'group' => 'System'],
            ['key' => 'users.hr.manage', 'description' => 'Manage Users', 'group' => 'HR'],
        ]);
        \Illuminate\Support\Facades\DB::table('role_capabilities')->insert([
            ['role' => 'super_admin', 'capability_key' => 'audit.view'],
            ['role' => 'super_admin', 'capability_key' => '*'],
            ['role' => 'hr', 'capability_key' => 'users.hr.manage'],
        ]);
        
        \Illuminate\Support\Facades\Cache::flush();
    }

    public function test_super_admin_can_access_audit_logs()
    {
        $user = User::factory()->create(['must_change_password' => false, 'onboarded_at' => now()]);
        RoleAssignment::create([
            'user_id' => $user->id,
            'role' => 'super_admin'
        ]);
        
        $token = $user->createToken('test', ['role:super_admin'])->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/audit-logs');

        if ($response->status() !== 200) {
            dump($response->json());
        }

        $response->assertStatus(200);
    }

    public function test_employee_cannot_access_audit_logs()
    {
        $user = User::factory()->create(['must_change_password' => false, 'onboarded_at' => now()]);
        RoleAssignment::create([
            'user_id' => $user->id,
            'role' => 'employee'
        ]);
        
        $token = $user->createToken('test', ['role:employee'])->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/audit-logs');

        $response->assertStatus(403);
    }

    public function test_hr_can_access_users_export()
    {
        $user = User::factory()->create(['must_change_password' => false, 'onboarded_at' => now()]);
        RoleAssignment::create([
            'user_id' => $user->id,
            'role' => 'hr'
        ]);
        
        $token = $user->createToken('test', ['role:hr'])->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/users/export');

        $response->assertStatus(200);
    }

    public function test_employee_cannot_access_users_export()
    {
        $user = User::factory()->create(['must_change_password' => false, 'onboarded_at' => now()]);
        RoleAssignment::create([
            'user_id' => $user->id,
            'role' => 'employee'
        ]);
        
        $token = $user->createToken('test', ['role:employee'])->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/users/export');

        $response->assertStatus(403);
    }
}
