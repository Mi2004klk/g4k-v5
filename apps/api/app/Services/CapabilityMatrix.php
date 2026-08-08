<?php

namespace App\Services;

class CapabilityMatrix
{
    /**
     * Map of roles to the capabilities they possess.
     */
    const MATRIX = [
        'super_admin' => [
            '*', // Super admin has all capabilities
        ],
        'hr' => [
            'users.view',
            'users.create_employee',
            'users.edit_employee',
            'users.deactivate_employee',
            
            'departments.view',
            
            'designations.view',
            
            'profile.edit',
            'directory.view',
        ],
        'employee' => [
            'profile.edit',
            'directory.view',
        ],
    ];

    /**
     * Check if a role has a specific capability.
     */
    public static function hasCapability(string $role, string $capability): bool
    {
        if (!isset(self::MATRIX[$role])) {
            return false;
        }

        $roleCapabilities = self::MATRIX[$role];

        if (in_array('*', $roleCapabilities)) {
            return true;
        }

        return in_array($capability, $roleCapabilities);
    }
}
