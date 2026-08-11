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

        $this->hr = User::factory()->create([
            'must_change_password' => false,
            'onboarded_at' => now(),
        ]);
        $this->hr->roleAssignments()->create(['role' => 'hr']);

        $this->employee = User::factory()->create([
            'must_change_password' => false,
            'onboarded_at' => now(),
        ]);
        $this->employee->roleAssignments()->create(['role' => 'employee']);
        
        $this->employee2 = User::factory()->create([
            'must_change_password' => false,
            'onboarded_at' => now(),
        ]);
        $this->employee2->roleAssignments()->create(['role' => 'employee']);
    }

    public function test_employee_can_submit_leave_request_and_fires_notification()
    {
        $token = $this->employee->createToken('test', ['role:employee', 'leave.request-self'])->plainTextToken;
        
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->postJson('/api/leave-requests', [
            'start_date' => '2026-10-10',
            'end_date' => '2026-10-12',
            'type' => 'casual',
            'reason' => 'Family event'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('leave_requests', [
            'user_id' => $this->employee->id,
        ]);
        
        // Assert notification fired for HR
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->hr->id,
            'type' => 'approval_pending'
        ]);
    }

    public function test_duplicate_overlap_is_rejected()
    {
        $token = $this->employee->createToken('test', ['role:employee', 'leave.request-self'])->plainTextToken;

        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->postJson('/api/leave-requests', [
            'start_date' => '2026-10-10',
            'end_date' => '2026-10-12',
            'type' => 'casual',
            'reason' => 'Family event'
        ]);

        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->postJson('/api/leave-requests', [
            'start_date' => '2026-10-11',
            'end_date' => '2026-10-15',
            'type' => 'casual',
            'reason' => 'Another event'
        ]);

        $response->assertStatus(422);
    }

    public function test_hr_can_approve_employee_leave_and_attendance_marked()
    {
        $empToken = $this->employee->createToken('test', ['role:employee', 'leave.request-self'])->plainTextToken;
        
        $request = $this->withHeaders(['Authorization' => 'Bearer ' . $empToken])
            ->postJson('/api/leave-requests', [
            'start_date' => '2026-10-10',
            'end_date' => '2026-10-10',
            'type' => 'sick',
            'reason' => 'Fever'
        ])->json();

        $leaveId = $request['id'] ?? $request['data']['id'];

        $approvalId = $request['approval_id'] ?? $request['approval']['id'] ?? $request['data']['approval']['id'] ?? null;

        app('auth')->forgetGuards();

        $hrToken = $this->hr->createToken('test', ['role:hr', 'leave.approve-employee'])->plainTextToken;
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $hrToken])
            ->postJson("/api/approvals/{$leaveId}/decision", [
            'decision' => 'approved',
        ]);

        if ($response->status() !== 200) {
            dump($response->json());
        }
        $response->assertStatus(200);

        // Verify status sync
        $this->assertDatabaseHas('approvals', [
            'approvable_id' => $leaveId,
            'status' => 'approved'
        ]);

        app('auth')->forgetGuards();

        $req2 = $this->withHeaders(['Authorization' => 'Bearer ' . $empToken])
            ->postJson('/api/leave-requests', [
            'start_date' => '2026-10-12', // Monday
            'end_date' => '2026-10-12',
            'type' => 'casual',
            'reason' => 'Rest'
        ])->json();
        
        $leaveId2 = $req2['id'] ?? $req2['data']['id'];

        app('auth')->forgetGuards();

        $response2 = $this->withHeaders(['Authorization' => 'Bearer ' . $hrToken])
            ->postJson("/api/approvals/{$leaveId2}/decision", [
            'decision' => 'approved',
        ]);
        if ($response2->status() !== 200) {
            dump("Response 2:", $response2->json('message'));
        }
        $response2->assertStatus(200);

        $this->assertDatabaseHas('attendance_days', [
            'user_id' => $this->employee->id,
            'date' => '2026-10-12',
            'status' => 'leave'
        ]);
        
        // Assert notification fired for Employee
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->employee->id,
            'type' => 'approval_decided'
        ]);
    }

    public function test_hr_cannot_approve_hr_leave_403()
    {
        $hr2 = User::factory()->create([
            'must_change_password' => false,
            'onboarded_at' => now(),
        ]);
        $hr2->roleAssignments()->create(['role' => 'hr']);

        $hr2Token = $hr2->createToken('test', ['role:hr', 'leave.request-self'])->plainTextToken;
        $request = $this->withHeaders(['Authorization' => 'Bearer ' . $hr2Token])
            ->postJson('/api/leave-requests', [
            'start_date' => '2026-11-10',
            'end_date' => '2026-11-10',
            'type' => 'casual',
            'reason' => 'Test'
        ])->json();

        $leaveId = $request['id'] ?? $request['data']['id'];

        app('auth')->forgetGuards();

        $hrToken = $this->hr->createToken('test', ['role:hr', 'leave.approve-employee'])->plainTextToken;
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $hrToken])
            ->postJson("/api/approvals/{$leaveId}/decision", [
            'decision' => 'approved'
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_approve_hr_leave()
    {
        $hrToken = $this->hr->createToken('test', ['role:hr', 'leave.request-self'])->plainTextToken;
        $request = $this->withHeaders(['Authorization' => 'Bearer ' . $hrToken])
            ->postJson('/api/leave-requests', [
            'start_date' => '2026-11-10',
            'end_date' => '2026-11-10',
            'type' => 'casual',
            'reason' => 'Test'
        ])->json();

        $leaveId = $request['id'] ?? $request['data']['id'];
        $approvalId = $request['approval_id'] ?? $request['approval']['id'] ?? $request['data']['approval']['id'] ?? null;

        if (app()->environment('testing')) {
            dump('Admin ID: ' . $this->admin->id . ' HR ID: ' . $this->hr->id);
        }

        app('auth')->forgetGuards();

        $adminToken = $this->admin->createToken('test', ['role:super_admin', 'leave.approve-hr'])->plainTextToken;
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $adminToken])
            ->postJson("/api/approvals/{$leaveId}/decision", [
            'decision' => 'approved'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('approvals', [
            'id' => $approvalId,
            'status' => 'approved'
        ]);
    }
}
