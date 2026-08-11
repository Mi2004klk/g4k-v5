<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Notification;
use App\Models\AttendanceDay;
use Carbon\Carbon;

class AlertMissedClockIn implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $today = now()->toDateString();
        $now = now();
        
        // Skip on Sundays
        if (now()->isSunday()) {
            return;
        }

        // Get offset setting
        $offsetSetting = \App\Models\Setting::where('key', 'missed_clockin_alert_offset')->value('value') ?? 15;
        $offsetMinutes = (int) $offsetSetting;

        // Default schedule
        $defaultSchedule = DB::table('work_schedules')->where('is_default', true)->first();

        // Get all active employees who haven't clocked in
        $users = User::where('status', 'active')
            ->whereDoesntHave('attendanceDays', function($query) use ($today) {
                $query->where('date', $today);
            })
            ->get();

        foreach ($users as $user) {
            $schedule = $defaultSchedule; 
            $startTimeStr = $schedule->start_time ?? '09:00:00';
            $graceMinutes = $schedule->grace_minutes ?? 10;
            
            $shiftStart = Carbon::parse($today . ' ' . $startTimeStr);
            $targetTime = $shiftStart->copy()->addMinutes($graceMinutes)->addMinutes($offsetMinutes);
            
            // Check if current time is within a 5-minute window of the target
            if ($now->between($targetTime->copy()->subMinutes(1), $targetTime->copy()->addMinutes(4))) {
                
                $onLeave = DB::table('leave_requests')
                    ->where('user_id', $user->id)
                    ->where('status', 'approved')
                    ->where('start_date', '<=', $today)
                    ->where('end_date', '>=', $today)
                    ->exists();
                    
                $isHoliday = DB::table('holidays')->where('date', $today)->exists();

                if (!$onLeave && !$isHoliday) {
                    // Notify HR for this department
                    $hrUsers = User::whereHas('roles', function($q) {
                        $q->where('role', 'super_admin');
                    })->orWhere(function($q) use ($user) {
                        $q->where('department_id', $user->department_id)
                          ->whereHas('roles', function($q2) {
                              $q2->where('role', 'hr');
                          });
                    })->get();

                    foreach ($hrUsers as $hr) {
                        Notification::create([
                            'user_id' => $hr->id,
                            'title' => 'Missed Clock-In Alert',
                            'body' => "{$user->name} has missed their clock-in today (overdue by {$offsetMinutes}m).",
                            'type' => 'alert',
                            'priority' => 'high'
                        ]);
                    }
                }
            }
        }
    }
}
