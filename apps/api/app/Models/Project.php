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
    use \App\Traits\HasDemoTag;
    use SoftDeletes;
    protected $fillable = ['name', 'description', 'status', 'priority', 'start_date',
        'end_date', 'deadline', 'team_id', 'department_id', 'progress', 'created_by',
        'submission_note', 'completed_at', 'demo_tag', 'is_demo', 'qa_form_id', 
        'allow_employee_tasks', 'cover_image'
    ];

    protected $appends = [
        'current_phase',
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
        return $this->morphOne(Approval::class, 'approvable')->latestOfMany();
    }

    public function phases(): HasMany
    {
        return $this->hasMany(ProjectPhase::class)->orderBy('sort_order', 'asc');
    }

    public function getCurrentPhaseAttribute()
    {
        return $this->phases()->where('status', '!=', 'completed')->orderBy('sort_order', 'asc')->first();
    }

    public function qaForm(): BelongsTo
    {
        return $this->belongsTo(QaForm::class);
    }

    public function qaSubmission(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(QaSubmission::class);
    }

    public function getCoverImageAttribute($value)
    {
        if (!$value) {
            return null;
        }

        // If it's already a full URL (e.g., from an older record), return as is
        if (str_starts_with($value, 'http')) {
            return $value;
        }

        try {
            return \Illuminate\Support\Facades\Storage::disk(config('filesystems.default'))->url($value);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
