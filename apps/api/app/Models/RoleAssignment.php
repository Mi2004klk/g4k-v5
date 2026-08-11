<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['user_id', 'role'])]
class RoleAssignment extends Model
{
    public static function getRolesForUser(int $userId): array
    {
        return \Illuminate\Support\Facades\Cache::remember("user_roles_{$userId}", 60, function () use ($userId) {
            return static::where('user_id', $userId)->pluck('role')->toArray();
        });
    }
}
