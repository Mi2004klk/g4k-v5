<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class CapabilityMatrix
{
    /**
     * Capabilities that are SELF-SERVICE and excluded for super_admin.
     */
    protected const SELF_SERVICE_EXCLUDED = [
        'attendance.clock-self',
        'leave.request-self',
        'timer.track',
        'tasks.create-own',
    ];

    /**
     * Default role capability matrix fallback for unseeded or fresh environments.
     */
    protected static array $defaultMatrix = [
        'super_admin' => ['*'],
        'hr' => [
            'hr.view-team-attendance', 'attendance.correct-team', 'leave.approve-employee',
            'users.employee.manage', 'directory.view', 'directory.send-message', 'chat.access', 'chat.manage',
            'profile.edit',
            'reports.view', 'tasks.view', 'tasks.manage', 'projects.view', 'projects.manage', 'qa.view', 'qa.manage',
            'announcements.manage'
        ],
        'employee' => [
            'attendance.clock-self', 'leave.request-self', 'profile.edit',
            'chat.access', 'tasks.view', 'tasks.create-own', 'projects.view', 'timer.track', 'directory.view'
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
     * Get assigned roles for a given user ID.
     */
    public static function getAssignedRoles(int $userId): array
    {
        return \App\Models\RoleAssignment::where('user_id', $userId)
            ->pluck('role')
            ->toArray();
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
        if ($role === 'super_admin' && in_array($capability, self::SELF_SERVICE_EXCLUDED, true)) {
            return false;
        }

        $roleCapabilities = static::getCapabilitiesForRole($role);

        if (in_array('*', $roleCapabilities)) {
            return true;
        }

        return in_array($capability, $roleCapabilities);
    }
}
