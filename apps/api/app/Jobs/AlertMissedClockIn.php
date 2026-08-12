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
        $offsetSetting = \App\Models\Setting::where('key', 'reminders.missed_clock_in_offset')->value('value') ?? 30;
        $offsetMinutes = (int) $offsetSetting;

        // Prefetch all work schedules to avoid N+1 queries
        $workSchedules = \Illuminate\Support\Facades\DB::table('work_schedules')->get()->keyBy('id');
        $defaultSchedule = $workSchedules->firstWhere('is_default', true);

        // Get all active employees who haven't clocked in
        $users = User::where('status', 'active')
            ->whereDoesntHave('attendanceDays', function($query) use ($today) {
                $query->where('date', $today);
            })
            ->get();

        $isHoliday = DB::table('holidays')->where('date', $today)->exists();
        $usersOnLeave = DB::table('leave_requests')
            ->where('status', 'approved')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->pluck('user_id')
            ->toArray();

        $superAdmins = User::whereHas('roleAssignments', fn($q) => $q->where('role', 'super_admin'))->get();
        $hrByDept = User::whereHas('roleAssignments', fn($q) => $q->where('role', 'hr'))->get()->groupBy('department_id');

        $notifications = [];

        foreach ($users as $user) {
            $schedule = ($user->work_schedule_id && $workSchedules->has($user->work_schedule_id))
                ? $workSchedules->get($user->work_schedule_id)
                : $defaultSchedule;
            
            $startTimeStr = $schedule->start_time ?? '09:00:00';
            $graceMinutes = $schedule->grace_minutes ?? 10;
            
            $shiftStart = Carbon::parse($today . ' ' . $startTimeStr);
            $targetTime = $shiftStart->copy()->addMinutes($offsetMinutes);
            
            // Check if current time is within a 5-minute window of the target
            if ($now->between($targetTime->copy()->subMinutes(1), $targetTime->copy()->addMinutes(4))) {
                $onLeave = in_array($user->id, $usersOnLeave);

                if (!$onLeave && !$isHoliday) {
                    $hrUsers = collect($superAdmins)->merge($hrByDept[$user->department_id] ?? [])->unique('id');

                    foreach ($hrUsers as $hr) {
                        $notifications[] = [
                            'user_id' => $hr->id,
                            'title' => 'Missed Clock-In Alert',
                            'body' => "{$user->name} hasn't clocked in ({$offsetMinutes}m after shift start).",
                            'type' => 'alert',
                            'priority' => 'high',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }
            }
        }

        if (!empty($notifications)) {
            Notification::insert($notifications);
        }
    }
}
