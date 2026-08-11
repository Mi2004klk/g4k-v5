<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Project extends Model
{
    protected $fillable = [
        'name', 'description', 'status', 'priority', 'start_date',
        'end_date', 'deadline', 'team_id', 'department_id', 'progress', 'created_by'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'deadline' => 'date',
        'progress' => 'integer',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function timeLogs(): HasMany
    {
        return $this->hasMany(TaskTimeLog::class);
    }

    public function approval(): MorphOne
    {
        return $this->morphOne(Approval::class, 'approvable');
    }
}
