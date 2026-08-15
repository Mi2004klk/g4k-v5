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
        
        // Get offset setting
        $offsetSetting = \App\Models\Setting::where('key', 'reminders.missed_clock_in_offset')->value('value') ?? 30;
        $offsetMinutes = (int) $offsetSetting;

        // Prefetch all work schedules to avoid N+1 queries
        $workSchedules = \Illuminate\Support\Facades\DB::table('work_schedules')->get()->keyBy('id');
        $defaultSchedule = $workSchedules->firstWhere('is_default', true);

        // Get all active employees who haven't clocked in (exclude HR/Admin from alerts)
        $users = User::where('status', 'active')
            ->whereDoesntHave('roleAssignments', function($q) {
                $q->whereIn('role', ['hr', 'super_admin']);
            })
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

        $superAdminIds = User::whereHas('roleAssignments', fn($q) => $q->where('role', 'super_admin'))->pluck('id')->toArray();
        $hrPivotRecords = DB::table('department_hr')->get();
        $hrIdsByDept = [];
        foreach ($hrPivotRecords as $pivot) {
            $hrIdsByDept[$pivot->department_id][] = $pivot->user_id;
        }

        $notifications = [];
        $dayIso = now()->dayOfWeekIso;

        foreach ($users as $user) {
            $schedule = ($user->work_schedule_id && $workSchedules->has($user->work_schedule_id))
                ? $workSchedules->get($user->work_schedule_id)
                : $defaultSchedule;

            $workingDays = [1, 2, 3, 4, 5, 6];
            if ($schedule && !empty($schedule->working_days)) {
                $decoded = is_string($schedule->working_days) ? json_decode($schedule->working_days, true) : $schedule->working_days;
                if (is_array($decoded)) {
                    $workingDays = array_map('intval', $decoded);
                }
            }

            if (!in_array($dayIso, $workingDays)) {
                continue;
            }
            
            $startTimeStr = $schedule->start_time ?? '09:00:00';
            $graceMinutes = $schedule->grace_minutes ?? 10;
            
            $shiftStart = Carbon::parse($today . ' ' . $startTimeStr);
            $targetTime = $shiftStart->copy()->addMinutes($offsetMinutes);
            
            // Check if current time is within a 5-minute window of the target
            if ($now->between($targetTime->copy()->subMinutes(1), $targetTime->copy()->addMinutes(4))) {
                $onLeave = in_array($user->id, $usersOnLeave);

                if (!$onLeave && !$isHoliday) {
                    $hrUserIds = collect($superAdminIds)->merge($hrIdsByDept[$user->department_id] ?? [])->unique();

                    foreach ($hrUserIds as $hrId) {
                        $notifications[] = [
                            'user_id' => $hrId,
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

        foreach ($notifications as $n) {
            \App\Services\NotificationService::send(
                $n['user_id'],
                $n['type'] ?? 'alert',
                $n['title'],
                $n['body'],
                $n['data'] ?? null,
                $n['link'] ?? null,
                $n['priority'] ?? 'high'
            );
        }
    }
}
