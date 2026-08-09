<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class CapabilityMatrix
{
    /**
     * Get array of capabilities for a given role.
     */
    public static function getCapabilitiesForRole(string $role): array
    {
        return Cache::remember("role_capabilities_{$role}", 3600, function () use ($role) {
            return DB::table('role_capabilities')
                ->where('role', $role)
                ->pluck('capability_key')
                ->toArray();
        });
    }

    /**
     * Check if a role has a specific capability.
     */
    public static function hasCapability(string $role, string $capability): bool
    {
        $roleCapabilities = static::getCapabilitiesForRole($role);

        if (in_array('*', $roleCapabilities)) {
            return true;
        }

        return in_array($capability, $roleCapabilities);
    }
}
