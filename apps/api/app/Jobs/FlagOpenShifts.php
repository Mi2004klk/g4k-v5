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
        
        // Find open shifts from previous days that haven't been flagged yet
        $openDays = AttendanceDay::where('has_open_shift', true)
            ->where('date', '<', $today)
            ->where('is_flagged', false)
            ->with('user')
            ->get();

        $superAdmins = User::whereHas('roleAssignments', fn($q) => $q->where('role', 'super_admin'))->get();
        $hrByDept = User::whereHas('roleAssignments', fn($q) => $q->where('role', 'hr'))->get()->groupBy('department_id');

        $notifications = [];
        $dayIds = [];

        foreach ($openDays as $day) {
            $user = $day->user;
            if (!$user) continue;

            $dayIds[] = $day->id;

            // Notify the user
            $notifications[] = [
                'user_id' => $user->id,
                'title' => 'Missing Clock-Out',
                'body' => "You forgot to clock out on {$day->date}. Please contact HR to correct your timesheet.",
                'type' => 'alert',
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // Find HR for this department or global Admins
            $hrUsers = collect($superAdmins)->merge($hrByDept[$user->department_id] ?? [])->unique('id');

            foreach ($hrUsers as $hr) {
                $notifications[] = [
                    'user_id' => $hr->id,
                    'title' => 'Open Shift Flagged',
                    'body' => "{$user->name} missed a clock-out on {$day->date}. Correction required.",
                    'type' => 'info',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        if (!empty($dayIds)) {
            AttendanceDay::whereIn('id', $dayIds)->update(['is_flagged' => true]);
        }

        if (!empty($notifications)) {
            Notification::insert($notifications);
        }
    }
}
