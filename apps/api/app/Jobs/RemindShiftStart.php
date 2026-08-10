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
        $offsetSetting = \App\Models\Setting::where('key', 'shift_reminder_offset')->value('value') ?? 10;
        $offsetMinutes = (int) $offsetSetting;

        // Default schedule
        $defaultSchedule = DB::table('work_schedules')->where('is_default', true)->first();

        // Get users who haven't clocked in yet today
        $users = User::where('status', 'active')
            ->whereDoesntHave('attendanceDays', function($query) use ($today) {
                $query->where('date', $today);
            })
            ->get();

        foreach ($users as $user) {
            $schedule = $defaultSchedule; // Assuming default for now, could be loaded per user if relationships exist
            $startTimeStr = $schedule->start_time ?? '09:00:00';
            $shiftStart = Carbon::parse($today . ' ' . $startTimeStr);
            
            // Target is offsetMinutes BEFORE shift start
            $targetTime = $shiftStart->copy()->subMinutes($offsetMinutes);
            
            // Check if current time is within a 5-minute window of the target (since job runs every 5 mins)
            if ($now->between($targetTime->copy()->subMinutes(1), $targetTime->copy()->addMinutes(4))) {
                
                $onLeave = DB::table('leave_requests')
                    ->where('user_id', $user->id)
                    ->where('status', 'approved')
                    ->where('start_date', '<=', $today)
                    ->where('end_date', '>=', $today)
                    ->exists();
                    
                $isHoliday = DB::table('holidays')->where('date', $today)->exists();

                if (!$onLeave && !$isHoliday) {
                    Notification::create([
                        'user_id' => $user->id,
                        'title' => 'Shift Starting Soon',
                        'body' => "Friendly reminder: Your shift starts at " . $shiftStart->format('H:i') . ". Don't forget to clock in!",
                        'type' => 'info',
                    ]);
                }
            }
        }
    }
}
