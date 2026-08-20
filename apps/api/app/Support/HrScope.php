<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class HrScope
{
    public static function managedDepartmentIds(User $hr): array
    {
        try {
            $ids = $hr->managedDepartments()->pluck('departments.id')->all();
            return array_values(array_unique($ids));
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Scopes a query by HR departments if the user is an HR.
     * Uses a subquery for 'user_id' resolution if target is not users/department_id directly.
     */
    public static function apply($query, User $actor, string $relationOrColumn = 'department_id')
    {
        $role = $actor->resolveActiveRole();
        if ($role === 'super_admin') {
            return $query;
        }

        if ($role === 'hr') {
            $deptIds = self::managedDepartmentIds($actor);
            
            if (empty($deptIds)) {
                return $query->whereRaw('1 = 0');
            }
            
            // If the query is directly on a table with department_id
            if ($relationOrColumn === 'department_id') {
                return $query->whereIn('department_id', $deptIds);
            }
            
            // If the target column is user_id or another user-referencing column, join or subquery through users table
            if ($relationOrColumn === 'user_id' || str_ends_with($relationOrColumn, '.user_id') || $relationOrColumn === 'assignee_id' || $relationOrColumn === 'created_by') {
                return $query->whereIn($relationOrColumn, function ($sub) use ($deptIds) {
                    $sub->select('id')->from('users')->whereIn('department_id', $deptIds);
                });
            }
            
            // If the target column is team_id, join or subquery through teams table
            if ($relationOrColumn === 'team_id' || str_ends_with($relationOrColumn, '.team_id')) {
                return $query->whereIn($relationOrColumn, function ($sub) use ($deptIds) {
                    $sub->select('id')->from('teams')->whereIn('department_id', $deptIds);
                });
            }
            
            // Fallback for relation querying
            return $query->whereHas($relationOrColumn, function ($q) use ($deptIds) {
                $q->whereIn('department_id', $deptIds);
            });
        }

        return $query->whereRaw('1 = 0');
    }
}
