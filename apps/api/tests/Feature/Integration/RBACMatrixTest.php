<?php

namespace Tests\Feature\Integration;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\LeaveRequest;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class RBACMatrixTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed'); // Requires the DB to be seeded for roles/capabilities to work correctly.
        Cache::flush();
    }

    public function test_rbac_matrix_attendance_and_leave()
    {
        $employee = User::where('username', 'praveen')->first(); // role: employee
        $hr = User::where('username', 'aravind')->first(); // role: hr
        $admin = User::where('username', 'karthik')->first(); // role: super_admin

        $employee->forceFill(['must_change_password' => false, 'onboarded_at' => now(), 'active_role' => 'employee'])->save();
        $hr->forceFill(['must_change_password' => false, 'onboarded_at' => now(), 'active_role' => 'hr'])->save();
        $admin->forceFill(['must_change_password' => false, 'onboarded_at' => now(), 'active_role' => 'super_admin'])->save();

        \App\Services\CapabilityMatrix::clearCache();
        Cache::flush();
        // dump(\App\Services\CapabilityMatrix::getCapabilitiesForRole('hr'));

        $empToken = $employee->createToken('emp', ['role:employee'])->plainTextToken;
        $hrToken = $hr->createToken('hr', ['role:hr'])->plainTextToken;
        $adminToken = $admin->createToken('admin', ['role:super_admin'])->plainTextToken;

        // 1. Employee tries to access HR dashboard (Should be 403)
        $this->withToken($empToken)
            ->getJson("/api/attendance/hr/graph?date=" . now()->format('Y-m-d'))
            ->assertStatus(403, 'Step 1 failed');

        app('auth')->forgetGuards();
        $this->app->forgetInstance('auth');

        // 2. HR tries to access HR dashboard (Should be 200)
        $response = $this->withToken($hrToken)
            ->getJson("/api/attendance/hr/graph?date=" . now()->format('Y-m-d'));
        $this->assertEquals(200, $response->status(), 'Step 2 failed: ' . json_encode($response->json()));

        app('auth')->forgetGuards();

        // 3. Admin tries to access HR dashboard (Should be 200)
        $response = $this->withToken($adminToken)
            ->getJson("/api/attendance/hr/graph?date=" . now()->format('Y-m-d'));
        $this->assertEquals(200, $response->status(), 'Step 3 failed: ' . json_encode($response->json()));

        app('auth')->forgetGuards();

        // Setup a leave request to test approvals
        $leave = LeaveRequest::create([
            'user_id' => $employee->id,
            'type' => 'sick',
            'start_date' => now()->addDays(1)->format('Y-m-d'),
            'end_date' => now()->addDays(2)->format('Y-m-d'),
            'reason' => 'Sick',
            'status' => 'pending'
        ]);
        
        $approval = \App\Models\Approval::create([
            'approvable_type' => LeaveRequest::class,
            'approvable_id' => $leave->id,
            'status' => 'pending',
            'submitted_by' => $employee->id,
            'current_approver_role' => 'hr' // Needs HR or super_admin
        ]);
        $leave->update(['approval_id' => $approval->id]);

        // 4. Employee tries to approve their own leave (Should be 403 or exception thrown as 403/500)
        $response = $this->withToken($empToken)
            ->postJson("/api/approvals/{$approval->id}/decision", [
                'decision' => 'approved'
            ]);
        $this->assertNotEquals(200, $response->status(), 'Step 4 failed');

        app('auth')->forgetGuards();

        // 5. Admin tries to approve the leave (Should be 200)
        $response = $this->withToken($adminToken)
            ->postJson("/api/approvals/{$approval->id}/decision", [
                'decision' => 'approved',
                'reason' => 'Admin override'
            ]);
        $this->assertEquals(200, $response->status(), 'Step 5 failed: ' . json_encode($response->json()));

        app('auth')->forgetGuards();

        // 6. Employee tests clock in (Should be 200)
        \App\Models\AttendanceEvent::where('user_id', $employee->id)->delete();
        \App\Models\AttendanceDay::where('user_id', $employee->id)->delete();
        $punchInTime = now()->setTime(10, 0, 0);
        
        $resp = $this->withToken($empToken)
            ->postJson('/api/attendance/clock-in', [
                'timestamp' => $punchInTime->toISOString(),
                'ip_address' => '127.0.0.1',
                'client_id' => 'test-emp'
            ]);
        if ($resp->status() !== 200) dump("Employee ID in test: " . $employee->id, $resp->json());
        $this->assertEquals(200, $resp->status(), 'Step 6 failed: ' . json_encode($resp->json()));

        app('auth')->forgetGuards();

        // 7. Admin tests clock in (Should be 403 as self-service clock is excluded for super_admin)
        \App\Models\AttendanceEvent::where('user_id', $admin->id)->delete();
        \App\Models\AttendanceDay::where('user_id', $admin->id)->delete();
        $this->withToken($adminToken)
            ->postJson('/api/attendance/clock-in', [
                'timestamp' => $punchInTime->toISOString(),
                'ip_address' => '127.0.0.1',
                'client_id' => 'test-admin'
            ])
            ->assertStatus(403);
    }
}
