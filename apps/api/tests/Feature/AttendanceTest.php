<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\AttendanceEvent;
use App\Models\AttendanceDay;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;
use Illuminate\Support\Str;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $hrUser;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\Cache::flush();
        $this->withoutMiddleware([
            \App\Http\Middleware\RequireCapability::class,
            \App\Http\Middleware\ForceOnboarding::class,
            \App\Http\Middleware\ForcePasswordChange::class,
        ]);
        
        $this->user = User::factory()->create([
            'onboarded_at' => now(),
            'must_change_password' => false,
        ]);
        $this->hrUser = User::factory()->create([
            'department_id' => $this->user->department_id,
            'onboarded_at' => now(),
            'must_change_password' => false,
        ]);
        
        \Illuminate\Support\Facades\DB::table('role_assignments')->insert([
            'user_id' => $this->hrUser->id,
            'role' => 'admin',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \Illuminate\Support\Facades\DB::table('capabilities')->insert([
            ['key' => 'attendance.clock-self'],
            ['key' => '*'],
        ]);

        \Illuminate\Support\Facades\DB::table('role_capabilities')->insert([
            ['role' => 'admin', 'capability_key' => '*'],
            ['role' => 'employee', 'capability_key' => 'attendance.clock-self'],
        ]);
        
        \Illuminate\Support\Facades\DB::table('work_schedules')->insert([
            'name' => 'Default',
            'is_default' => true,
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'standard_seconds' => 28800,
            'grace_minutes' => 10,
        ]);
    }

    protected function actingAsUser($user, $role)
    {
        \Laravel\Sanctum\Sanctum::actingAs($user, ["role:$role"]);
        return $this;
    }

    public function test_can_clock_in()
    {
        $response = $this->actingAsUser($this->user, 'employee')->postJson('/api/attendance/clock-in', [
            'client_id' => Str::uuid()->toString(),
            'timestamp' => now()->toIso8601String(),
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('attendance_events', [
            'user_id' => $this->user->id,
            'type' => 'clock_in',
        ]);
    }

    public function test_rejects_invalid_punch_sequence()
    {
        // Try to break start without clocking in
        $response = $this->actingAsUser($this->user, 'employee')->postJson('/api/attendance/start-break', [
            'client_id' => Str::uuid()->toString(),
        ]);

        $response->assertStatus(422);

        // Clock in
        $this->actingAsUser($this->user, 'employee')->postJson('/api/attendance/clock-in', [
            'client_id' => Str::uuid()->toString(),
        ]);

        // Try to clock in again
        $response = $this->actingAsUser($this->user, 'employee')->postJson('/api/attendance/clock-in', [
            'client_id' => Str::uuid()->toString(),
        ]);

        $response->assertStatus(422);
    }

    public function test_reconciliation_calculates_overtime_and_late()
    {
        $date = now()->format('Y-m-d');
        
        // Late clock in (after 9:10)
        $clockInTime = Carbon::parse($date . ' 09:15:00');
        $this->actingAsUser($this->user, 'employee')->postJson('/api/attendance/clock-in', [
            'client_id' => Str::uuid()->toString(),
            'timestamp' => $clockInTime->toIso8601String(),
        ]);

        // Break
        $this->actingAsUser($this->user, 'employee')->postJson('/api/attendance/start-break', [
            'client_id' => Str::uuid()->toString(),
            'timestamp' => $clockInTime->copy()->addHours(3)->toIso8601String(),
        ]);
        $this->actingAsUser($this->user, 'employee')->postJson('/api/attendance/end-break', [
            'client_id' => Str::uuid()->toString(),
            'timestamp' => $clockInTime->copy()->addHours(4)->toIso8601String(),
        ]);

        // Clock out (overtime)
        $clockOutTime = Carbon::parse($date . ' 19:15:00');
        $response = $this->actingAsUser($this->user, 'employee')->postJson('/api/attendance/clock-out', [
            'client_id' => Str::uuid()->toString(),
            'timestamp' => $clockOutTime->toIso8601String(),
        ]);

        $response->assertStatus(200);

        $day = AttendanceDay::where('user_id', $this->user->id)->where('date', $date)->first();
        
        $this->assertEquals(15, $day->late_minutes); // 9:15 - 9:00 = 15m
        $this->assertEquals(3600, $day->break_seconds); // 1 hour break
        
        if ($day->total_seconds === 0) dd($day->toArray());
        
        // Total time = 10 hours - 1 hour break = 9 hours = 32400 seconds
        $this->assertEquals(32400, $day->total_seconds);
        
        // Standard is 28800 (8 hours). Overtime = 32400 - 28800 = 3600 seconds
        $this->assertEquals(3600, $day->overtime_seconds);
        $this->assertEquals('late', $day->status);
    }

    public function test_offline_sync_deduplicates_and_sorts()
    {
        $date = now()->format('Y-m-d');
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse($date . ' 18:00:00'));

        $clientId = Str::uuid()->toString();
        
        $events = [
            [
                'client_id' => Str::uuid()->toString(),
                'type' => 'clock_out',
                'timestamp' => Carbon::parse($date . ' 17:00:00')->toIso8601String(),
            ],
            [
                'client_id' => $clientId,
                'type' => 'clock_in',
                'timestamp' => Carbon::parse($date . ' 09:00:00')->toIso8601String(),
            ],
            [
                'client_id' => $clientId, // Duplicate client_id
                'type' => 'clock_in',
                'timestamp' => Carbon::parse($date . ' 09:00:00')->toIso8601String(),
            ]
        ];

        $response = $this->actingAsUser($this->user, 'employee')->postJson('/api/attendance/sync', [
            'events' => $events
        ]);

        $response->assertStatus(200);

        // Should only have 2 events due to deduplication
        $this->assertEquals(2, AttendanceEvent::where('user_id', $this->user->id)->count());
        
        // Day should be fully reconciled
        $day = AttendanceDay::where('user_id', $this->user->id)->where('date', $date)->first();
        $this->assertFalse($day->has_open_shift);

        \Carbon\Carbon::setTestNow(null);
    }

    public function test_hr_can_correct_attendance()
    {
        $date = now()->format('Y-m-d');
        
        $response = $this->actingAsUser($this->user, 'employee')->postJson('/api/attendance/clock-in', [
            'client_id' => Str::uuid()->toString(),
            'timestamp' => Carbon::parse($date . ' 09:00:00')->toIso8601String(),
        ]);
        
        if ($response->status() !== 200) {
            file_put_contents('error_log.json', json_encode($response->json()));
            $this->fail("CLOCK IN FAILED: See error_log.json");
        }
        $dayId = $response->json('day.id');

        // HR adds a missing clock_out
        $response = $this->actingAsUser($this->hrUser, 'admin')->postJson('/api/attendance/correct', [
            'action' => 'add_event',
            'attendance_day_id' => $dayId,
            'type' => 'clock_out',
            'timestamp' => Carbon::parse($date . ' 17:00:00')->toIso8601String(),
            'reason' => 'Forgot to clock out',
        ]);
        
        if ($response->status() !== 200) {
            file_put_contents('error_log.json', json_encode($response->json()));
            $this->fail("CORRECT FAILED: See error_log.json");
        }


        $response->assertStatus(200);
        
        $this->assertDatabaseHas('attendance_corrections', [
            'attendance_day_id' => $dayId,
            'corrected_by' => $this->hrUser->id,
            'field' => 'add_event',
        ]);
        
        $day = AttendanceDay::find($dayId);
        $this->assertEquals('manual', $day->source);
        $this->assertFalse($day->has_open_shift);

        // Verify notification sent
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'title' => 'Attendance Corrected',
        ]);
    }
}
