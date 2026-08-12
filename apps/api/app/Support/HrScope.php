<?php

namespace App\Support;

use App\Models\User;

class HrScope
{
    public static function managedDepartmentIds(User $hr): array
    {
        $ids = $hr->managedDepartments()->pluck('departments.id')->all();
        // backward-compat: include own department if not already managed
        if ($hr->department_id && !in_array($hr->department_id, $ids)) {
            $ids[] = $hr->department_id;
        }
        return $ids;
    }
}
