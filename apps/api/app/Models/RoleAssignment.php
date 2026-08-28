<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['user_id', 'role', 'demo_tag'])]
class RoleAssignment extends Model
{
    use \App\Traits\HasDemoTag;

    protected static function booted()
    {
        static::saved(function ($assignment) {
            self::clearUserRoleCaches($assignment->user_id);
        });

        static::deleted(function ($assignment) {
            self::clearUserRoleCaches($assignment->user_id);
        });
    }

    protected static function clearUserRoleCaches($userId)
    {
        \Illuminate\Support\Facades\Cache::forget("user_{$userId}");
        \Illuminate\Support\Facades\Cache::forget("user_{$userId}_roles");
        \Illuminate\Support\Facades\Cache::forget("user.{$userId}.roles");
        \Illuminate\Support\Facades\Cache::forget("user_roles_{$userId}");
    }
}
