<?php

namespace App\Support;

use App\Models\User;

class HrScope
{
    public static function managedDepartmentIds(User $hr): array
    {
        try {
            $ids = $hr->managedDepartments()->pluck('departments.id')->all();
            if ($hr->department_id && !in_array($hr->department_id, $ids)) {
                $ids[] = $hr->department_id;
            }
            return array_values(array_unique($ids));
        } catch (\Throwable $e) {
            return $hr->department_id ? [$hr->department_id] : [];
        }
    }
}
