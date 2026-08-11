<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\AttendanceDay;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AlertMissedClockIn extends Command
{
    protected $signature = 'attendance:alert-missed';
    protected $description = 'Alert HR if employees missed clock in (30 mins late).';

    public function handle()
    {
        $now = now();
        $users = User::where('status', 'active')->get();
        $date = $now->toDateString();
        $defaultSchedule = DB::table('work_schedules')->where('is_default', true)->first();

        foreach ($users as $user) {
            $schedule = $user->work_schedule_id 
                ? DB::table('work_schedules')->where('id', $user->work_schedule_id)->first() 
                : $defaultSchedule;
                
            if (!$schedule) continue;
            
            $targetTime = $now->copy()->subMinutes(30)->format('H:i:00');
            $startTime = Carbon::parse($schedule->start_time)->format('H:i:00');
            
            if ($startTime !== $targetTime) continue;

            $punched = AttendanceDay::where('user_id', $user->id)->where('date', $date)->exists();
            if (!$punched) {
                // Find HR managers in their department
                $hrUsers = User::where('department_id', $user->department_id)
                    ->whereHas('roles', function ($q) {
                        $q->where('role', 'hr');
                    })->get();
                
                foreach ($hrUsers as $hr) {
                    \App\Models\Notification::create([
                        'user_id' => $hr->id,
                        'type' => 'attendance_alert',
                        'title' => 'Missed Clock In Alert',
                        'body' => "Employee {$user->name} has missed their expected clock-in time by over 30 minutes.",
                        'link' => '/dashboard/org/attendance?date=' . $date,
                    ]);
                }
            }
        }

        $this->info('Missed clock in alerts checked.');
    }
}
