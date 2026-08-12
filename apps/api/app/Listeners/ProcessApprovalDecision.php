<?php

namespace App\Listeners;

use App\Events\ApprovalDecided;
use App\Models\User;
use App\Models\Notification;

class ProcessApprovalDecision
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

        $typeLabel = str_replace('App\\Models\\', '', $approval->approvable_type);
        
        $body = "Your {$typeLabel} request has been {$approval->decision}.";
        if ($approval->decision === 'redo') {
            $body = "Your {$typeLabel} requires changes. Reason: {$approval->decision_reason}";
        }

        $link = '/dashboard';
        if ($approval->approvable_type === \App\Models\LeaveRequest::class) {
            $link = '/dashboard/leave';
        } elseif ($approval->approvable_type === \App\Models\Task::class) {
            $link = '/dashboard/tasks';
        }

        // Notify submitter of decision
        Notification::create([
            'user_id' => $submitter->id,
            'type' => 'approval_decided',
            'title' => 'Approval Decision',
            'body' => $body,
            'link' => $link,
        ]);
    }
}
