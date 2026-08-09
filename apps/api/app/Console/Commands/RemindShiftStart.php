<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RemindShiftStart extends Command
{
    protected $signature = 'attendance:remind-start';
    protected $description = 'Remind employees 15 minutes before their shift starts.';

    public function handle()
    {
        $now = now();
        $targetTime = $now->copy()->addMinutes(15)->format('H:i:00');

        $schedule = DB::table('work_schedules')->where('is_default', true)->first();
        if (!$schedule || $schedule->start_time !== $targetTime) {
            return;
        }

        $users = User::where('status', 'active')->get();

        foreach ($users as $user) {
            \App\Models\Notification::create([
                'user_id' => $user->id,
                'type' => 'attendance_reminder',
                'title' => 'Shift Starts Soon',
                'body' => 'Your shift is scheduled to start in 15 minutes. Please remember to clock in.',
                'link' => '/dashboard/attendance',
            ]);
        }

        $this->info('Reminders sent.');
    }
}
