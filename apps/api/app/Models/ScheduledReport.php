<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduledReport extends Model
{
    protected $fillable = [
        'name',
        'type',
        'frequency',
        'time',
        'day_of_week',
        'day_of_month',
        'recipients',
        'is_active',
        'last_run_at',
        'next_run_at',
    ];

    protected $casts = [
        'recipients' => 'array',
        'is_active' => 'boolean',
        'last_run_at' => 'datetime',
        'next_run_at' => 'datetime',
    ];
}
