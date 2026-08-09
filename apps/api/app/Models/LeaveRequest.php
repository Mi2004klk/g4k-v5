<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class LeaveRequest extends Model
{
    protected $fillable = [
        'user_id', 'start_date', 'end_date', 'reason', 'type', 'approval_id'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvalModel(): BelongsTo
    {
        return $this->belongsTo(Approval::class, 'approval_id');
    }

    public function approval(): MorphOne
    {
        return $this->morphOne(Approval::class, 'approvable');
    }
}
