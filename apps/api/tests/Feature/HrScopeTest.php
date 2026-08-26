<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use Laravel\Sanctum\Sanctum;

class HrScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_hr_can_only_see_users_in_managed_departments()
    {
        $deptAId = \Illuminate\Support\Facades\DB::table('departments')->insertGetId(['name' => 'Dept A', 'created_at' => now(), 'updated_at' => now()]);
        $deptBId = \Illuminate\Support\Facades\DB::table('departments')->insertGetId(['name' => 'Dept B', 'created_at' => now(), 'updated_at' => now()]);

        // Users
        $userA = User::factory()->create(['department_id' => $deptAId]);
        $userB = User::factory()->create(['department_id' => $deptBId]);

        // HR user managing Dept A only
        $hr = User::factory()->create();
        $hr->roleAssignments()->create(['role' => 'hr']);
        
        \Illuminate\Support\Facades\DB::table('department_hr')->insert([
            'department_id' => $deptAId,
            'user_id' => $hr->id,
        ]);

        Sanctum::actingAs($hr, ['role:hr']);

        $response = $this->getJson('/api/directory');
        $response->assertStatus(200);
        
        $data = collect($response->json('data.data'));
        
        $this->assertTrue($data->contains('id', $userA->id));
        $this->assertFalse($data->contains('id', $userB->id));
    }

    public function test_super_admin_can_see_all_users()
    {
        $deptAId = \Illuminate\Support\Facades\DB::table('departments')->insertGetId(['name' => 'Dept A', 'created_at' => now(), 'updated_at' => now()]);
        $deptBId = \Illuminate\Support\Facades\DB::table('departments')->insertGetId(['name' => 'Dept B', 'created_at' => now(), 'updated_at' => now()]);

        $userA = User::factory()->create(['department_id' => $deptAId]);
        $userB = User::factory()->create(['department_id' => $deptBId]);

        $superAdmin = User::factory()->create();
        $superAdmin->roleAssignments()->create(['role' => 'super_admin']);

        Sanctum::actingAs($superAdmin, ['role:super_admin']);

        $response = $this->getJson('/api/directory');
        $response->assertStatus(200);
        
        $data = collect($response->json('data.data'));
        
        $this->assertTrue($data->contains('id', $userA->id));
        $this->assertTrue($data->contains('id', $userB->id));
    }
}
