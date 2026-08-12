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
        $users = User::where('status', 'active')->get();
        $defaultSchedule = \Illuminate\Support\Facades\Cache::remember('default_work_schedule', 86400, function() {
            return \Illuminate\Support\Facades\DB::table('work_schedules')->where('is_default', true)->first();
        });

        foreach ($users as $user) {
            $schedule = $user->work_schedule_id 
                ? \Illuminate\Support\Facades\Cache::remember("work_schedule_{$user->work_schedule_id}", 86400, function() use ($user) {
                    return \Illuminate\Support\Facades\DB::table('work_schedules')->where('id', $user->work_schedule_id)->first();
                })
                : $defaultSchedule;
                
            if (!$schedule) continue;
            
            $targetTime = $now->copy()->addMinutes(15)->format('H:i:00');
            $startTime = Carbon::parse($schedule->start_time)->format('H:i:00');
            
            if ($startTime !== $targetTime) continue;
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
