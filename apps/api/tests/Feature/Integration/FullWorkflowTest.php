<?php

namespace Tests\Feature\Integration;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class FullWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMockingConsoleOutput();
        Cache::flush();
        // Seed standard DB structure including roles, capabilities, default schedules
        $this->seed();
    }

    public function test_full_attendance_and_leave_workflow()
    {
        // Bypass mass assignment
        \Illuminate\Support\Facades\DB::table('users')->update([
            'must_change_password' => false,
            'onboarded_at' => now()
        ]);

        $hr = User::where('username', 'aravind')->first();
        $employee = User::where('username', 'praveen')->first();

        $this->assertNotNull($hr);
        $this->assertNotNull($employee);

        $empToken = $employee->createToken('emp-token', ['role:employee'])->plainTextToken;
        $hrToken = $hr->createToken('hr-token', ['role:hr'])->plainTextToken;

        // 2. Employee Clocks In
        \App\Models\AttendanceEvent::where('user_id', $employee->id)->delete();
        \App\Models\AttendanceDay::where('user_id', $employee->id)->delete();
        
        $punchInTime = now()->setTime(9, 30, 0); // 9:30 AM (Late)
        
        $response = $this->withToken($empToken)
            ->postJson('/api/attendance/clock-in', [
                'timestamp' => $punchInTime->toISOString(),
                'ip_address' => '127.0.0.1',
                'client_id' => 'test-client-clock-in',
            ]);
            
        if ($response->status() !== 200) {
            dd($response->json(), $response->status());
        }
        $response->assertStatus(200);
        
        // 3. Employee Takes Break
        $breakStartTime = $punchInTime->copy()->addHours(4);
        $response = $this->withToken($empToken)
            ->postJson('/api/attendance/start-break', [
                'timestamp' => $breakStartTime->toISOString(),
                'client_id' => 'test-client-break-start',
            ]);
        
        $response->assertStatus(200);

        $breakEndTime = $breakStartTime->copy()->addMinutes(45);
        $response = $this->withToken($empToken)
            ->postJson('/api/attendance/end-break', [
                'timestamp' => $breakEndTime->toISOString(),
                'client_id' => 'test-client-end-break',
            ]);
        
        $response->assertStatus(200);

        // 5. Employee Clocks Out
        $punchOutTime = $breakEndTime->copy()->addHours(4);
        $response = $this->withToken($empToken)
            ->postJson('/api/attendance/clock-out', [
                'timestamp' => $punchOutTime->toISOString(),
                'client_id' => 'test-client-clock-out',
            ]);
        
        $response->assertStatus(200);
        
        // Verify timesheet generation (assuming the clock_out creates or updates a timesheet)
        $this->assertDatabaseHas('attendance_days', [
            'user_id' => $employee->id,
            'date' => $punchInTime->format('Y-m-d')
        ]);

        // 7. Employee Requests Leave
        $leaveStart = now()->addDays(1)->format('Y-m-d');
        $response = $this->withToken($empToken)
            ->postJson('/api/leave-requests', [
                'type' => 'sick',
                'start_date' => $leaveStart,
                'end_date' => $leaveStart,
                'reason' => 'Feeling unwell',
            ]);
        
        $response->assertStatus(201);
        $leaveRequestId = $response->json('id') ?? $response->json('data.id');
        $approvalId = $response->json('approval_id') ?? $response->json('data.approval_id') ?? $response->json('approval.id') ?? $response->json('data.approval.id');

        // 8. HR Views Leave Requests
        app('auth')->forgetGuards();
        
        $response = $this->withToken($hrToken)
            ->getJson('/api/leave-requests');
        $response->assertStatus(200);
        
        // 9. HR Approves Leave Request
        $response = $this->withToken($hrToken)
            ->postJson("/api/approvals/{$leaveRequestId}/decision", [
                'decision' => 'approved',
                'reason' => 'Get well soon!',
            ]);
        
        $response->assertStatus(200);
        
        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveRequestId,
            'status' => 'approved',
        ]);
        
        // 10. HR views team attendance graph
        $response = $this->withToken($hrToken)
            ->getJson("/api/attendance/hr/graph?date=" . $punchInTime->format('Y-m-d'));
        $response->assertStatus(200);
    }
}
