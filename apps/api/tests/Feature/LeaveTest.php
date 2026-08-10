<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\LeaveRequest;
use App\Models\Holiday;
use App\Models\AttendanceDay;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LeaveTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $hr;
    protected $employee;
    protected $employee2;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::factory()->create([
            'must_change_password' => false,
            'onboarded_at' => now(),
        ]);
        $this->admin->roleAssignments()->create(['role' => 'super_admin']);
        $this->admin->update(['active_role' => 'super_admin']);

        $this->hr = User::factory()->create([
            'must_change_password' => false,
            'onboarded_at' => now(),
        ]);
        $this->hr->roleAssignments()->create(['role' => 'hr']);
        $this->hr->update(['active_role' => 'hr']);

        $this->employee = User::factory()->create([
            'must_change_password' => false,
            'onboarded_at' => now(),
        ]);
        $this->employee->roleAssignments()->create(['role' => 'employee']);
        $this->employee->update(['active_role' => 'employee']);
        
        $this->employee2 = User::factory()->create([
            'must_change_password' => false,
            'onboarded_at' => now(),
        ]);
        $this->employee2->roleAssignments()->create(['role' => 'employee']);
        $this->employee2->update(['active_role' => 'employee']);
    }

    public function test_employee_can_submit_leave_request_and_fires_notification()
    {
        Sanctum::actingAs($this->employee, ['role:employee']);
        
        $response = $this->postJson('/api/leave-requests', [
            'start_date' => '2026-10-10',
            'end_date' => '2026-10-12',
            'type' => 'casual',
            'reason' => 'Family event'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('leave_requests', [
            'user_id' => $this->employee->id,
            'start_date' => '2026-10-10',
        ]);
        
        // Assert notification fired for HR
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->hr->id,
            'type' => 'leave_request_submitted'
        ]);
    }

    public function test_duplicate_overlap_is_rejected()
    {
        Sanctum::actingAs($this->employee, ['role:employee']);

        $this->postJson('/api/leave-requests', [
            'start_date' => '2026-10-10',
            'end_date' => '2026-10-12',
            'type' => 'casual',
            'reason' => 'Family event'
        ]);

        // Attempt overlapping
        $response = $this->postJson('/api/leave-requests', [
            'start_date' => '2026-10-11',
            'end_date' => '2026-10-15',
            'type' => 'casual',
            'reason' => 'Another event'
        ]);

        $response->assertStatus(422);
    }

    public function test_hr_can_approve_employee_leave_and_attendance_marked()
    {
        Sanctum::actingAs($this->employee, ['role:employee']);
        
        $request = $this->postJson('/api/leave-requests', [
            'start_date' => '2026-10-10',
            'end_date' => '2026-10-10',
            'type' => 'sick',
            'reason' => 'Fever'
        ])->json();

        $leaveId = $request['id'] ?? $request['data']['id'];

        // HR approves
        Sanctum::actingAs($this->hr, ['role:hr']);
        $response = $this->postJson("/api/leave-requests/{$leaveId}/decision", [
            'decision' => 'approved',
        ]);

        $response->assertStatus(200);

        // Verify status sync
        $this->assertDatabaseHas('approvals', [
            'id' => $approvalId,
            'status' => 'approved'
        ]);

        // Check AttendanceDay generated for working day
        Sanctum::actingAs($this->employee, ['role:employee']);
        $req2 = $this->postJson('/api/leave-requests', [
            'start_date' => '2026-10-12', // Monday
            'end_date' => '2026-10-12',
            'type' => 'casual',
            'reason' => 'Rest'
        ])->json();
        
        $leaveId2 = $req2['id'] ?? $req2['data']['id'];

        Sanctum::actingAs($this->hr, ['role:hr']);
        $this->postJson("/api/leave-requests/{$leaveId2}/decision", [
            'decision' => 'approved',
        ]);

        $this->assertDatabaseHas('attendance_days', [
            'user_id' => $this->employee->id,
            'date' => '2026-10-12',
            'status' => 'on_leave',
            'leave_type' => 'casual'
        ]);
        
        // Assert notification fired for Employee
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->employee->id,
            'type' => 'leave_approved'
        ]);
    }

    public function test_hr_cannot_approve_hr_leave_403()
    {
        $hr2 = User::factory()->create([
            'must_change_password' => false,
            'onboarded_at' => now(),
        ]);
        $hr2->roleAssignments()->create(['role' => 'hr']);
        $hr2->update(['active_role' => 'hr']);

        Sanctum::actingAs($hr2, ['role:hr']);
        $request = $this->postJson('/api/leave-requests', [
            'start_date' => '2026-11-10',
            'end_date' => '2026-11-10',
            'type' => 'casual',
            'reason' => 'Test'
        ])->json();

        $leaveId = $request['id'] ?? $request['data']['id'];

        Sanctum::actingAs($this->hr, ['role:hr']);
        $response = $this->postJson("/api/leave-requests/{$leaveId}/decision", [
            'decision' => 'approved'
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_approve_hr_leave()
    {
        Sanctum::actingAs($this->hr, ['role:hr']);
        $request = $this->postJson('/api/leave-requests', [
            'start_date' => '2026-11-10',
            'end_date' => '2026-11-10',
            'type' => 'casual',
            'reason' => 'Test'
        ])->json();

        $leaveId = $request['id'] ?? $request['data']['id'];
        $approvalId = $request['approval_id'] ?? $request['approval']['id'] ?? $request['data']['approval']['id'] ?? null;

        Sanctum::actingAs($this->admin, ['role:super_admin']);
        $response = $this->postJson("/api/leave-requests/{$leaveId}/decision", [
            'decision' => 'approved'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('approvals', [
            'id' => $approvalId,
            'status' => 'approved'
        ]);
    }
}
