<?php

namespace App\Observers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Database\Eloquent\Model;

class CacheInvalidationObserver
{
    private function clearDashboardCaches(Model $model)
    {
        try {
            \App\Services\DashboardCacheService::invalidateGlobal();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to clear dashboard caches: ' . $e->getMessage());
        }
    }

    public function created(Model $model)
    {
        $this->clearDashboardCaches($model);
    }

    public function updated(Model $model)
    {
        if ($model instanceof \App\Models\User) {
            $dirty = $model->getDirty();
            $ignored = ['last_login_at', 'last_active_at', 'remember_token', 'updated_at', 'current_sign_in_at', 'last_sign_in_at'];
            $importantChanges = array_diff(array_keys($dirty), $ignored);
            if (empty($importantChanges)) {
                return;
            }
        }
        $this->clearDashboardCaches($model);
    }

    public function deleted(Model $model)
    {
        $this->clearDashboardCaches($model);
    }
}
