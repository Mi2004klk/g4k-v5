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
        $this->clearDashboardCaches($model);
    }

    public function deleted(Model $model)
    {
        $this->clearDashboardCaches($model);
    }
}
