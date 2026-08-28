<?php

namespace App\Observers;

use App\Models\AttendanceDay;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class AttendanceDayObserver
{
    public function saved(AttendanceDay $day)
    {
        $this->clearCaches($day);
    }

    public function deleted(AttendanceDay $day)
    {
        $this->clearCaches($day);
    }

    private function clearCaches(AttendanceDay $day)
    {
        $user = $day->user;
        if (!$user) return;

        $activeRole = $user->resolveActiveRole();
        $date = $day->date;
        $today = Carbon::now()->toDateString();

        // Clear user-specific caches
        Cache::forget("attendanceSummary_{$user->id}");
        Cache::forget("attendance_day_{$user->id}_{$date}");

        // Clear caches for HR and Admins who manage this user
        $managers = \App\Models\RoleAssignment::whereIn('role', ['hr', 'super_admin'])->pluck('user_id')->unique();
        
        foreach ($managers as $managerId) {
            $manager = \App\Models\User::find($managerId);
            if ($manager) {
                if (in_array('super_admin', $manager->getCachedRoles()) || $manager->department_id === $user->department_id) {
                    $version = \App\Services\DashboardCacheService::getVersion();
                    Cache::forget("team_today_v{$version}_u{$managerId}_{$date}");
                }
            }
        }
    }
}
