<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HrAttendanceWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->withoutMiddleware();
        
        $this->hrDept = Department::create(['name' => 'HR']);
        $this->engDept = Department::create(['name' => 'Engineering']);
        
        $this->hrManager = User::factory()->create([
            'department_id' => $this->hrDept->id
        ]);

        $this->hrEmployee = User::factory()->create([
            'department_id' => $this->hrDept->id
        ]);
        
        $this->engEmployee = User::factory()->create([
            'department_id' => $this->engDept->id
        ]);
        
        $this->superAdmin = User::factory()->create();
    }

    public function test_hr_can_view_department_attendance_overview()
    {
        $token = $this->hrManager->createToken('test', ['role:hr', 'admin.view-all-attendance'])->plainTextToken;
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->getJson('/api/attendance/admin/overview');

        $response->assertStatus(200);
    }

    public function test_hr_can_view_employee_history_within_department()
    {
        $token = $this->hrManager->createToken('test', ['role:hr', 'hr.view-team-attendance'])->plainTextToken;
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->getJson("/api/attendance/hr/history/{$this->hrEmployee->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'user' => ['id', 'name'],
            'data' => []
        ]);
    }

    public function test_hr_cannot_view_employee_history_outside_department()
    {
        $token = $this->hrManager->createToken('test', ['role:hr', 'hr.view-team-attendance'])->plainTextToken;
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->getJson("/api/attendance/hr/history/{$this->engEmployee->id}");

        $response->assertStatus(403);
    }

    public function test_super_admin_can_view_any_employee_history()
    {
        $token = $this->superAdmin->createToken('test', ['role:super_admin', 'hr.view-team-attendance'])->plainTextToken;
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->getJson("/api/attendance/hr/history/{$this->engEmployee->id}");

        $response->assertStatus(200);
    }

    public function test_hr_can_correct_attendance()
    {
        $payload = [
            'user_id' => $this->hrEmployee->id,
            'date' => now()->toDateString(),
            'action' => 'add_event',
            'type' => 'clock_in',
            'timestamp' => now()->format('H:i'),
            'reason' => 'Forgot to clock in'
        ];

        $token = $this->hrManager->createToken('test', ['role:hr', 'admin.correct-attendance'])->plainTextToken;
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->postJson('/api/attendance/correct', $payload);

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Attendance event recorded manually.']);
        
        $this->assertDatabaseHas('attendance_events', [
            'user_id' => $this->hrEmployee->id,
            'type' => 'clock_in',
            'is_manual' => 1
        ]);
    }
}
