<?php

namespace App\Listeners;

use App\Events\ApprovalDecided;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LeaveAttendanceIntegration
{
    /**
     * Handle the event.
     */
    public function handle(ApprovalDecided $event): void
    {
        $approval = $event->approval;

        if ($approval->decision === 'approved' && $approval->approvable_type === LeaveRequest::class) {
            $leaveRequest = LeaveRequest::find($approval->approvable_id);
            if (!$leaveRequest) return;

            $userId = $leaveRequest->user_id;
            $startDate = Carbon::parse($leaveRequest->start_date);
            $endDate = Carbon::parse($leaveRequest->end_date);

            // Fetch holidays to exclude
            $holidays = DB::table('holidays')->pluck('date')->map(function ($date) {
                return Carbon::parse($date)->toDateString();
            })->toArray();

            // Fetch recurring holidays (if day/month matches, though standard date format is usually YYYY-MM-DD. For recurring, let's just assume we check the M-D part).
            // Simplification: We'll just check exact date matches from DB for now as per spec "excluded from absence".
            // Phase 5 already does its own reconciliation if an event occurs. Here we are forcing status to 'leave'.

            $currentDate = $startDate->copy();
            while ($currentDate->lte($endDate)) {
                $dateStr = $currentDate->toDateString();

                // Skip weekends (assuming Sat/Sun are weekends for simplicity, or check work schedule if available)
                // Actually the spec says "Holiday calendar excluded from absence computation".
                // If it's a holiday, we might still mark it as 'leave' or just skip. Let's mark as leave if it's not a holiday.
                if (!in_array($dateStr, $holidays)) {
                    DB::table('attendance_days')->updateOrInsert(
                        ['user_id' => $userId, 'date' => $dateStr],
                        [
                            'status' => 'leave',
                            'source' => 'server',
                            'updated_at' => now(),
                            'version' => DB::raw('version + 1')
                        ]
                    );
                }

                $currentDate->addDay();
            }
        }
    }
}
