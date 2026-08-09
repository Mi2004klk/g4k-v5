<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskTimeLog extends Model
{
    protected $fillable = [
        'task_id', 'project_id', 'user_id', 'minutes_logged',
        'started_at', 'ended_at', 'description', 'log_date'
    ];

    protected $casts = [
        'minutes_logged' => 'integer',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'log_date' => 'date',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
