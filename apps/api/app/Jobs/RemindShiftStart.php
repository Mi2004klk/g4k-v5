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
        
        // Skip on Sundays
        if (now()->isSunday()) {
            return;
        }

        // Get users who haven't clocked in yet today
        $users = User::where('status', 'active')
            ->whereDoesntHave('attendanceDays', function($query) use ($today) {
                $query->where('date', $today);
            })
            ->get();

        foreach ($users as $user) {
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
                    'message' => "Friendly reminder: Your shift starts soon. Don't forget to clock in!",
                    'type' => 'info',
                ]);
            }
        }
    }
}
