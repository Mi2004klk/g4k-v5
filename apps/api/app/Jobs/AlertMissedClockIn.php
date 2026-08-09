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
        
        // Skip on Sundays (or read from company settings if available)
        if (now()->isSunday()) {
            return;
        }

        // Get all active employees who are not on leave today
        // and don't have an attendance record
        $users = User::where('status', 'active')
            ->whereDoesntHave('attendanceDays', function($query) use ($today) {
                $query->where('date', $today);
            })
            ->get();

        foreach ($users as $user) {
            // Further checks could involve checking leave_requests for today
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
                    'title' => 'Missed Clock-In',
                    'message' => "You have not clocked in for today yet. Please clock in to start your shift.",
                    'type' => 'alert',
                ]);
            }
        }
    }
}
