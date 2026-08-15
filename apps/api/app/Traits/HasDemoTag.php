<?php

namespace App\Traits;

use Illuminate\Support\Facades\Schema;

trait HasDemoTag
{
    /**
     * Boot the trait.
     */
    protected static function bootHasDemoTag()
    {
        static::creating(function ($model) {
            // Protect audit logs from being demo tagged if they reflect real actions
            if ($model->getTable() === 'audit_logs' && !app()->has('demo_tag')) {
                return;
            }

            if (app()->has('demo_tag')) {
                $model->demo_tag = app('demo_tag');
                
                // Set is_demo to true if the column exists
                $table = $model->getTable();
                // Cache column check for performance
                $hasIsDemo = \Illuminate\Support\Facades\Cache::store('array')->remember("has_is_demo_{$table}", 3600, function () use ($table) {
                    return Schema::hasColumn($table, 'is_demo');
                });

                if ($hasIsDemo) {
                    $model->is_demo = true;
                }
            }
        });
    }
}
