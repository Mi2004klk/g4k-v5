<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class CapabilityMatrix
{
    /**
     * Default role capability matrix fallback for unseeded or fresh environments.
     */
    protected static array $defaultMatrix = [
        'super_admin' => ['*'],
        'hr' => [
            'hr.view-team-attendance', 'attendance.correct-team', 'leave.approve-employee',
            'users.employee.manage', 'directory.view', 'directory.send-message',
            'profile.edit', 'attendance.clock-self', 'leave.request-self',
            'reports.view'
        ],
        'employee' => [
            'attendance.clock-self', 'leave.request-self', 'profile.edit',
            'directory.view', 'directory.send-message', 'reports.view'
        ]
    ];

    /**
     * Get array of capabilities for a given role.
     */
    public static function getCapabilitiesForRole(string $role): array
    {
        return Cache::remember("role_capabilities_{$role}", 3600, function () use ($role) {
            $caps = DB::table('role_capabilities')
                ->where('role', $role)
                ->pluck('capability_key')
                ->toArray();

            if (empty($caps) && isset(static::$defaultMatrix[$role])) {
                return static::$defaultMatrix[$role];
            }

            return $caps;
        });
    }

    /**
     * Clear role capability cache.
     */
    public static function clearCache(?string $role = null): void
    {
        if ($role) {
            Cache::forget("role_capabilities_{$role}");
        } else {
            foreach (['super_admin', 'hr', 'employee'] as $r) {
                Cache::forget("role_capabilities_{$r}");
            }
        }
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
