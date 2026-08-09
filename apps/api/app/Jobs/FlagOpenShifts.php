<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use App\Models\AttendanceDay;
use App\Models\Notification;
use App\Models\User;

class FlagOpenShifts implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $today = now()->toDateString();
        
        // Find open shifts from previous days
        $openDays = AttendanceDay::where('has_open_shift', true)
            ->where('date', '<', $today)
            ->with('user')
            ->get();

        foreach ($openDays as $day) {
            $user = $day->user;
            if (!$user) continue;

            // Notify the user
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Missing Clock-Out',
                'body' => "You forgot to clock out on {$day->date}. Please contact HR to correct your timesheet.",
                'type' => 'alert',
            ]);

            // Find HR for this department or global Admins
            $hrUsers = User::whereHas('roles', function($q) {
                $q->whereIn('role', ['admin', 'super_admin']);
            })->orWhere(function($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->whereHas('roles', function($q2) {
                      $q2->where('role', 'hr');
                  });
            })->get();

            foreach ($hrUsers as $hr) {
                Notification::create([
                    'user_id' => $hr->id,
                    'title' => 'Open Shift Flagged',
                    'body' => "{$user->name} missed a clock-out on {$day->date}. Correction required.",
                    'type' => 'info',
                ]);
            }
        }
    }
}
