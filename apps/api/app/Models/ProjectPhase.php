<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectPhase extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id',
        'name',
        'description',
        'status',
        'sort_order',
        'start_date',
        'end_date',
        'completed_at',
        'assignee_id',
        'qa_form_id',
        'workflow_settings',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'completed_at' => 'datetime',
        'workflow_settings' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'phase_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function qaForm(): BelongsTo
    {
        return $this->belongsTo(QaForm::class, 'qa_form_id');
    }

    public function getTotalTimeSecondsAttribute()
    {
        return $this->tasks()->with('timeLogs')->get()->sum(function ($task) {
            return $task->timeLogs->sum('minutes_logged') * 60;
        });
    }

    public function getProgressAttribute()
    {
        $total = $this->tasks()->count();
        if ($total === 0) return 0;
        $completed = $this->tasks()->where('status', 'done')->count();
        return round(($completed / $total) * 100);
    }
}
