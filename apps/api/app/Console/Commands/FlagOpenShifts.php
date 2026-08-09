<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AttendanceDay;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FlagOpenShifts extends Command
{
    protected $signature = 'attendance:flag-open-shifts';
    protected $description = 'Flag shifts left open past grace period.';

    public function handle()
    {
        $now = now();
        $schedule = DB::table('work_schedules')->where('is_default', true)->first();
        $targetTime = $now->copy()->subHours(12)->format('H:i:00'); // Example: check past 12h

        $openShifts = AttendanceDay::where('has_open_shift', true)
            ->where('date', '<', $now->toDateString())
            ->get();

        foreach ($openShifts as $shift) {
            $shift->update(['has_open_shift' => false]);
            
            $user = $shift->user;
            if (!$user) continue;

            $hrUsers = \App\Models\User::where('department_id', $user->department_id)
                ->whereHas('roles', function ($q) {
                    $q->where('role', 'hr');
                })->get();
            
            foreach ($hrUsers as $hr) {
                \App\Models\Notification::create([
                    'user_id' => $hr->id,
                    'type' => 'attendance_alert',
                    'title' => 'Open Shift Flagged',
                    'body' => "Employee {$user->name} left their shift open past the 12-hour grace period on {$shift->date}.",
                    'link' => '/dashboard/org/attendance?date=' . $shift->date,
                ]);
            }
        }

        $this->info('Open shifts flagged and closed.');
    }
}
