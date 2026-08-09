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
        $targetTime = $now->copy()->subMinutes(30)->format('H:i:00');

        $schedule = DB::table('work_schedules')->where('is_default', true)->first();
        if (!$schedule || $schedule->start_time !== $targetTime) {
            return;
        }

        $users = User::where('status', 'active')->get();
        $date = $now->toDateString();

        foreach ($users as $user) {
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
