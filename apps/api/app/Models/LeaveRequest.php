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
        
        $days = 0;
        $current = \Carbon\Carbon::parse($startDate)->copy();
        $end = \Carbon\Carbon::parse($endDate);
        
        $workSchedule = null;
        if ($user->work_schedule_id) {
            $workSchedule = \App\Models\WorkSchedule::find($user->work_schedule_id);
        }
        if (!$workSchedule) {
            $workSchedule = \App\Models\WorkSchedule::where('is_default', true)->first();
        }
        
        $workingDays = $workSchedule ? $workSchedule->working_days : [1, 2, 3, 4, 5]; // Default Mon-Fri
        if (!is_array($workingDays)) $workingDays = [1, 2, 3, 4, 5];
        
        $holidays = \App\Models\Holiday::whereBetween('date', [$current->format('Y-m-d'), $end->format('Y-m-d')])->pluck('date')->toArray();

        while ($current <= $end) {
            $isWorkingDay = in_array($current->isoWeekday(), $workingDays);
            $isHoliday = in_array($current->format('Y-m-d'), $holidays);
            
            if ($isWorkingDay && !$isHoliday) {
                $days++;
            }
            $current->addDay();
        }
        
        return $days;
    }

    public function getWorkingDays(): int
    {
        return self::calculateWorkingDays($this->user, $this->start_date, $this->end_date);
    }
}
