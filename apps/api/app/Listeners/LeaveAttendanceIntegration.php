<?php

namespace App\Listeners;

use App\Events\ApprovalDecided;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class LeaveAttendanceIntegration implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(ApprovalDecided $event): void
    {
        $approval = $event->approval;

        if ($approval->decision === 'approved' && $approval->approvable_type === LeaveRequest::class) {
            $leaveRequest = LeaveRequest::find($approval->approvable_id);
            if (!$leaveRequest) return;

            \App\Services\AttendanceService::markLeaveDays(
                $leaveRequest->user_id,
                $leaveRequest->start_date,
                $leaveRequest->end_date
            );
        }
    }
}
