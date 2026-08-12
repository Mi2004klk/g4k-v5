<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Notification;
use Carbon\Carbon;

class RemindShiftStart implements ShouldQueue
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

        // Get offset setting (e.g. 10 minutes before shift)
        $offsetSetting = \App\Models\Setting::where('key', 'reminders.shift_offset')->value('value') ?? 10;
        $offsetMinutes = (int) $offsetSetting;

        // Prefetch all work schedules to avoid N+1 queries
        $workSchedules = \Illuminate\Support\Facades\DB::table('work_schedules')->get()->keyBy('id');
        $defaultSchedule = $workSchedules->firstWhere('is_default', true);

        // Get users who haven't clocked in yet today
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

        $notifications = [];

        foreach ($users as $user) {
            $schedule = ($user->work_schedule_id && $workSchedules->has($user->work_schedule_id))
                ? $workSchedules->get($user->work_schedule_id)
                : $defaultSchedule;
                
            $startTimeStr = $schedule->start_time ?? '09:00:00';
            $shiftStart = Carbon::parse($today . ' ' . $startTimeStr);
            
            // Target is offsetMinutes BEFORE shift start
            $targetTime = $shiftStart->copy()->subMinutes($offsetMinutes);
            
            // Check if current time is within a 5-minute window of the target (since job runs every 5 mins)
            if ($now->between($targetTime->copy()->subMinutes(1), $targetTime->copy()->addMinutes(4))) {
                
                $onLeave = in_array($user->id, $usersOnLeave);

                if (!$onLeave && !$isHoliday) {
                    $notifications[] = [
                        'user_id' => $user->id,
                        'title' => 'Shift Starting Soon',
                        'body' => "Friendly reminder: Your shift starts at " . $shiftStart->format('H:i') . ". Don't forget to clock in!",
                        'type' => 'info',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        if (!empty($notifications)) {
            Notification::insert($notifications);
        }
    }
}
