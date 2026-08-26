<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class LeaveRequest extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['user_id', 'start_date', 'end_date', 'reason', 'type', 'approval_id', 'status', 'demo_tag'];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approval(): MorphOne
    {
        return $this->morphOne(Approval::class, 'approvable');
    }

    public static function calculateWorkingDays($user, $startDate, $endDate): int
    {
        if (!$user) return 0;
        return \App\Support\WorkingDayCalculator::calculate($user, $startDate, $endDate);
    }

    public function getWorkingDays(): int
    {
        return self::calculateWorkingDays($this->user, $this->start_date, $this->end_date);
    }
}
