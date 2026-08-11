<?php

namespace App\Listeners;

use App\Events\ApprovalDecided;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use App\Models\User;
use App\Models\Notification;

class ProcessApprovalDecision implements ShouldQueue
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(ApprovalDecided $event): void
    {
        $approval = $event->approval;
        $submitter = User::find($approval->submitted_by);
        
        // Update the underlying model if needed
        if ($approval->approvable_type === \App\Models\LeaveRequest::class) {
            $leave = \App\Models\LeaveRequest::find($approval->approvable_id);
            if ($leave) {
                $leave->update(['status' => $approval->status]);
            }
        }

        if (!$submitter) return;

        // Notify submitter of decision
        Notification::create([
            'user_id' => $submitter->id,
            'type' => 'approval_decided',
            'title' => 'Approval Decision',
            'body' => "Your {$approval->approvable_type} request has been {$approval->decision}.",
            'link' => '/dashboard/attendance', // or /dashboard/leave
        ]);
    }
}
