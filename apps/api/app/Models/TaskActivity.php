<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskActivity extends Model
{
    protected $table = 'task_activity';
    public $timestamps = false;

    protected $fillable = ['task_id', 'user_id', 'event', 'metadata', 'created_at'];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
