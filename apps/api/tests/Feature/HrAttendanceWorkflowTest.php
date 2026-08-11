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
        $this->hrDept = Department::create(['name' => 'HR']);
        $this->engDept = Department::create(['name' => 'Engineering']);
        
        $this->hrManager = User::factory()->create([
            'department_id' => $this->hrDept->id,
            'onboarded_at' => now(),
            'must_change_password' => false,
        ]);

        $this->hrEmployee = User::factory()->create([
            'department_id' => $this->hrDept->id,
            'onboarded_at' => now(),
            'must_change_password' => false,
        ]);
        
        $this->engEmployee = User::factory()->create([
            'department_id' => $this->engDept->id,
            'onboarded_at' => now(),
            'must_change_password' => false,
        ]);
        
        $this->superAdmin = User::factory()->create([
            'onboarded_at' => now(),
            'must_change_password' => false,
        ]);
        \App\Models\RoleAssignment::create([
            'user_id' => $this->superAdmin->id,
            'role' => 'super_admin'
        ]);
    }

    public function test_hr_can_view_department_attendance_overview()
    {
        $token = $this->hrManager->createToken('test', ['role:hr', 'admin.view-all-attendance'])->plainTextToken;
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->getJson('/api/attendance/hr/today');
            
        if ($response->status() !== 200) {
            dump($response->json());
        }
        $response->assertStatus(200);
    }

    public function test_hr_can_view_employee_history_within_department()
    {
        $token = $this->hrManager->createToken('test', ['role:hr', 'hr.view-team-attendance'])->plainTextToken;
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->getJson("/api/attendance/hr/history/{$this->hrEmployee->id}");

        if (!array_key_exists('user', $response->json())) {
            dump("hrHistory response:", $response->json());
        }

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'user' => ['id', 'name', 'email']
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
        $day = \App\Models\AttendanceDay::create([
            'user_id' => $this->hrEmployee->id,
            'date' => now()->toDateString(),
            'status' => 'absent'
        ]);

        $payload = [
            'attendance_day_id' => $day->id,
            'action' => 'add_event',
            'type' => 'clock_in',
            'timestamp' => now()->format('Y-m-d H:i:s'),
            'reason' => 'Forgot to clock in'
        ];

        $token = $this->hrManager->createToken('test', ['role:hr', 'admin.correct-attendance'])->plainTextToken;
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->postJson('/api/attendance/correct', $payload);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'message' => 'Attendance event corrected successfully.'
            ]);
        $this->assertDatabaseHas('attendance_events', [
            'user_id' => $this->hrEmployee->id,
            'type' => 'clock_in',
            'source' => 'server'
        ]);
    }
}
