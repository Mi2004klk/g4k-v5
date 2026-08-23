<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Task extends Model
{
    use \App\Traits\HasDemoTag;
    use SoftDeletes;
    protected $fillable = ['project_id', 'phase_id', 'title', 'description', 'status', 'priority',
        'scope', 'assignee_id', 'reporter_id', 'start_date', 'due_date', 'progress',
        'parent_id', 'blocked_by', 'qa_form_id', 'recurrence',
        'submitted_at', 'submission_note', 'demo_tag'];

    protected $casts = [
        'due_date' => 'date',
        'progress' => 'integer',
        'recurrence' => 'array',
        'submitted_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::saved(function ($task) {
            $task->updateProjectProgress();
        });

        static::deleted(function ($task) {
            $task->updateProjectProgress();
        });
    }

    public function updateProjectProgress()
    {
        if ($this->project_id) {
            $avg = self::where('project_id', $this->project_id)->avg('progress') ?? 0;
            \App\Models\Project::where('id', $this->project_id)->update(['progress' => round($avg)]);
        }
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function phase(): BelongsTo
    {
        return $this->belongsTo(ProjectPhase::class, 'phase_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_assignees', 'task_id', 'user_id')->withTimestamps();
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_id');
    }

    public function blocker(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'blocked_by');
    }

    public function qaForm(): BelongsTo
    {
        return $this->belongsTo(QaForm::class, 'qa_form_id');
    }

    public function qaSubmission(): HasOne
    {
        return $this->hasOne(QaSubmission::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(TaskActivity::class);
    }

    public function timeLogs(): HasMany
    {
        return $this->hasMany(TaskTimeLog::class);
    }

    public function approval(): MorphOne
    {
        return $this->morphOne(Approval::class, 'approvable')->latestOfMany();
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(TaskReminder::class);
    }

    public function personalReminder(): HasOne
    {
        return $this->hasOne(TaskReminder::class)
            ->where('user_id', auth()->id())
            ->where('type', 'personal');
    }
}
