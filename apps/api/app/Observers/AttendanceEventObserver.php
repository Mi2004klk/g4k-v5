<?php

namespace App\Observers;

use App\Models\AttendanceEvent;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class AttendanceEventObserver
{
    public function saved(AttendanceEvent $event)
    {
        $this->clearCaches($event);
    }

    public function deleted(AttendanceEvent $event)
    {
        $this->clearCaches($event);
    }

    private function clearCaches(AttendanceEvent $event)
    {
        $user = $event->user;
        if (!$user) return;

        $activeRole = $user->resolveActiveRole();
        $date = Carbon::parse($event->timestamp)->toDateString();
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
