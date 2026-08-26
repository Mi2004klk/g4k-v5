<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class DashboardCacheService
{
    private const CACHE_VERSION_KEY = 'dashboard_global_version';

    /**
     * Get the current global dashboard cache version.
     * This acts as a prefix/tag for all dashboard metric keys.
     */
    public static function getVersion(): int
    {
        return Cache::rememberForever(self::CACHE_VERSION_KEY, function () {
            return 1;
        });
    }

    /**
     * Instantly invalidate all dashboard caches across the entire system.
     * This increments the global version, effectively abandoning all old cache keys.
     */
    public static function invalidateGlobal(): void
    {
        if (!Cache::has(self::CACHE_VERSION_KEY)) {
            Cache::put(self::CACHE_VERSION_KEY, 1);
        }
        Cache::increment(self::CACHE_VERSION_KEY);
    }
}
