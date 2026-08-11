<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Company;
use App\Models\WorkSchedule;
use App\Models\RoleAssignment;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PerformanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $company = Company::factory()->create();
        $department = Department::factory()->create(['company_id' => $company->id]);
        $designation = Designation::factory()->create(['department_id' => $department->id]);
        $schedule = WorkSchedule::factory()->create();

        // Create an admin user to make requests
        $this->admin = User::factory()->create([
            'department_id' => $department->id,
            'designation_id' => $designation->id,
            'work_schedule_id' => $schedule->id,
        ]);
        RoleAssignment::create(['user_id' => $this->admin->id, 'role' => 'admin']);
        RoleAssignment::create(['user_id' => $this->admin->id, 'role' => 'hr']);

        // Seed additional users for lists
        User::factory()->count(10)->create([
            'department_id' => $department->id,
            'designation_id' => $designation->id,
            'work_schedule_id' => $schedule->id,
        ]);
    }

    /**
     * @dataProvider performanceEndpointsProvider
     */
    public function test_endpoints_execute_within_query_limits(string $method, string $endpoint)
    {
        $this->actingAs($this->admin);

        // First request to warm up cache if any
        if ($method === 'GET') {
            $this->getJson($endpoint);
        }

        $this->assertQueryCountLessThan(6, function () use ($method, $endpoint) {
            if ($method === 'GET') {
                $response = $this->getJson($endpoint);
                $response->assertStatus(200);
            }
        });
    }

    public static function performanceEndpointsProvider(): array
    {
        return [
            'Users List' => ['GET', '/api/users'],
            'My Attendance History' => ['GET', '/api/attendance/me/history'],
            'Admin Attendance Overview' => ['GET', '/api/attendance/admin/overview'],
            'HR Attendance Today' => ['GET', '/api/attendance/hr/today'],
            'Leave Requests' => ['GET', '/api/leave-requests'],
            'Audit Logs' => ['GET', '/api/audit-logs'],
            'Attendance Summary Report' => ['GET', '/api/reports/attendance-summary'],
        ];
    }
}
