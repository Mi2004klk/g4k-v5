<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'break_minutes',
        'grace_minutes',
        'standard_seconds',
        'working_days',
        'effective_from',
        'is_default',
    ];

    protected $casts = [
        'working_days' => 'array',
        'is_default' => 'boolean',
        'break_minutes' => 'integer',
        'grace_minutes' => 'integer',
        'standard_seconds' => 'integer',
    ];
}
