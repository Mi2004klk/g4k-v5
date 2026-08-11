<?php

namespace App\Observers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Database\Eloquent\Model;

class CacheInvalidationObserver
{
    private function clearDashboardCaches(Model $model)
    {
        // Global and Admin caches
        Cache::forget('dashboard_global_stats');
        Cache::forget('dashboard_recent_activity');
        Cache::forget('dashboard_active_projects_count');
        Cache::forget('dashboard_pending_tasks_count');

        // If it's related to a user, clear their specific caches
        $userId = $model->user_id ?? $model->assignee_id ?? null;
        if ($userId) {
            $today = \Carbon\Carbon::now()->toDateString();
            
            // We can't know the role precisely here, so we clear for all known roles
            $roles = ['employee', 'hr', 'super_admin'];
            foreach ($roles as $role) {
                Cache::forget("dashboard_metrics_{$userId}_{$role}_{$today}");
            }
        }
    }

    public function created(Model $model)
    {
        $this->clearDashboardCaches($model);
    }

    public function updated(Model $model)
    {
        $this->clearDashboardCaches($model);
    }

    public function deleted(Model $model)
    {
        $this->clearDashboardCaches($model);
    }
}
