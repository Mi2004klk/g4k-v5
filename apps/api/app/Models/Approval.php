<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Approval extends Model
{
    protected $fillable = [
        'approvable_type', 'approvable_id', 'status', 'submitted_by',
        'submitted_at', 'current_approver_role', 'decision', 'decision_reason',
        'decided_by', 'decided_at', 'payload'
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'decided_at' => 'datetime',
        'payload' => 'array',
    ];

    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function decider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
