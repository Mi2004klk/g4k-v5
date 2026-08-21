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
        if ($approval->approvable_type === \App\Models\LeaveRequest::class || str_ends_with($approval->approvable_type, 'LeaveRequest')) {
            $link = '/dashboard/leave';
        } elseif ($approval->approvable_type === \App\Models\Task::class || str_ends_with($approval->approvable_type, 'Task')) {
            $task = \App\Models\Task::find($approval->approvable_id);
            if ($task && $task->project_id) {
                $link = "/dashboard/projects/{$task->project_id}?tab=tasks&task={$task->id}";
            } else {
                $link = "/dashboard/tasks";
            }
        } elseif ($approval->approvable_type === \App\Models\Project::class || str_ends_with($approval->approvable_type, 'Project')) {
            $link = "/dashboard/projects/{$approval->approvable_id}";
        }

        // Notify submitter of decision
        \App\Services\NotificationService::send(
            userId: $submitter->id,
            type: 'approval_decided',
            title: 'Approval Decision',
            body: $body,
            link: $link,
            priority: 'high'
        );
    }
}
