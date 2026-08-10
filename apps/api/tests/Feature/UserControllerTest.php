<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\RoleAssignment;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\Cache::flush();
        \Illuminate\Support\Facades\DB::table('capabilities')->insert([
            ['key' => '*', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'users.employee.manage', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'users.hr.manage', 'created_at' => now(), 'updated_at' => now()],
        ]);
        \Illuminate\Support\Facades\DB::table('role_capabilities')->insert([
            ['role' => 'super_admin', 'capability_key' => '*'],
            ['role' => 'hr', 'capability_key' => 'users.employee.manage'],
        ]);
    }

    public function test_admin_with_employee_manage_can_create_employee_but_not_hr()
    {
        $admin = User::factory()->create(['must_change_password' => false, 'onboarded_at' => now()]);
        $token = $admin->createToken('test', ['role:hr', 'users.employee.manage'])->plainTextToken;

        // Try creating employee (should work)
        $response1 = $this->withHeaders(['Authorization' => 'Bearer ' . $token])->postJson('/api/users', [
            'name' => 'Emp',
            'email' => 'emp@games4king.com',
            'roles' => ['employee'],
        ]);
        $response1->assertStatus(201);

        // Try creating HR (should fail 403)
        $response2 = $this->withHeaders(['Authorization' => 'Bearer ' . $token])->postJson('/api/users', [
            'name' => 'HR2',
            'email' => 'hr2@games4king.com',
            'roles' => ['hr'],
        ]);
        $response2->assertStatus(403);
    }

    public function test_index_filters_and_pagination()
    {
        $admin = User::factory()->create(['must_change_password' => false, 'onboarded_at' => now()]);
        $token = $admin->createToken('test', ['role:super_admin', '*'])->plainTextToken;

        $dept = Department::create(['name' => 'IT']);
        User::factory()->count(15)->create(['must_change_password' => false, 'onboarded_at' => now()]);
        
        $res = $this->withHeaders(['Authorization' => 'Bearer ' . $token])->getJson('/api/users');
        if ($res->status() !== 200) {
            dump($res->json());
        }
        $res->assertStatus(200);

        $u1 = User::factory()->create(['name' => 'John', 'department_id' => $dept->id, 'status' => 'active']);
        $u1->roleAssignments()->create(['role' => 'employee']);

        $u2 = User::factory()->create(['name' => 'Jane', 'status' => 'inactive']);
        $u2->roleAssignments()->create(['role' => 'hr']);

        // Test dept filter
        $res = $this->getJson('/api/users?department_id=' . $dept->id);
        $res->assertStatus(200);
        $this->assertCount(1, $res->json('data'));

        // Test status filter
        $res2 = $this->getJson('/api/users?status=inactive');
        $res2->assertStatus(200);
        $this->assertCount(1, $res2->json('data'));

        // Test search
        $res3 = $this->getJson('/api/users?search=Jane');
        $res3->assertStatus(200);
        $this->assertCount(1, $res3->json('data'));
    }

    public function test_export_endpoint()
    {
        $admin = User::factory()->create(['must_change_password' => false, 'onboarded_at' => now()]);
        $token = $admin->createToken('test', ['role:super_admin', '*'])->plainTextToken;

        $res = $this->withHeaders(['Authorization' => 'Bearer ' . $token])->get('/api/users/export');
        $res->assertStatus(200);
    }

    public function test_cannot_deactivate_last_super_admin()
    {
        $admin = User::factory()->create(['must_change_password' => false, 'onboarded_at' => now(), 'status' => 'active']);
        $admin->roleAssignments()->create(['role' => 'super_admin']);
        $token = $admin->createToken('test', ['role:super_admin', '*'])->plainTextToken;

        $res = $this->withHeaders(['Authorization' => 'Bearer ' . $token])->patchJson('/api/users/' . $admin->id . '/status', [
            'status' => 'inactive'
        ]);

        $res->assertStatus(422)
            ->assertJson(['message' => 'Cannot deactivate the last active Super Admin.']);
    }

    public function test_can_deactivate_user()
    {
        $admin = User::factory()->create(['must_change_password' => false, 'onboarded_at' => now(), 'status' => 'active']);
        $token = $admin->createToken('test', ['role:super_admin', '*'])->plainTextToken;

        $user = User::factory()->create(['status' => 'active']);

        $res = $this->withHeaders(['Authorization' => 'Bearer ' . $token])->patchJson('/api/users/' . $user->id . '/status', [
            'status' => 'inactive'
        ]);

        $res->assertStatus(200);
        $this->assertEquals('inactive', $user->fresh()->status);
    }
}
