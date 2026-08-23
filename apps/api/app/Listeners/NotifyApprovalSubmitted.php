<?php

namespace App\Listeners;

use App\Events\ApprovalSubmitted;
use App\Models\User;
use App\Models\Notification;

class NotifyApprovalSubmitted
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
    public function handle(ApprovalSubmitted $event): void
    {
        $approval = $event->approval;
        $submitter = User::find($approval->submitted_by);
        if (!$submitter) return;

        // If the approver role is HR, notify the HR managers in the submitter's department.
        // If it's admin/super_admin, notify them.
        if ($approval->approvable_type === \App\Models\Project::class || $approval->approvable_type === \App\Models\Task::class) {
            $targetRoles = ['hr', 'super_admin'];
            $targetUsers = User::whereHas('roles', function ($q) use ($targetRoles) {
                $q->whereIn('role', $targetRoles);
            })->get();
        } else {
            $targetRole = $approval->current_approver_role;
            $targetUsers = collect();
            if ($targetRole === 'hr') {
                $targetUsers = User::where('department_id', $submitter->department_id)
                    ->whereHas('roles', function ($q) {
                        $q->where('role', 'hr');
                    })->get();
            } else {
                $targetUsers = User::whereHas('roles', function ($q) use ($targetRole) {
                    $q->where('role', $targetRole);
                })->get();
            }
        }

        $type = class_basename($approval->approvable_type);
        $link = '/dashboard/org/attendance?tab=leave&sub=approvals';
        if ($approval->approvable_type === \App\Models\Project::class || str_ends_with($approval->approvable_type, 'Project')) {
            $link = "/dashboard/projects/{$approval->approvable_id}";
        } elseif ($approval->approvable_type === \App\Models\Task::class || str_ends_with($approval->approvable_type, 'Task')) {
            // If we have the task loaded and it has a project, we can link there. Otherwise just tasks page.
            $task = \App\Models\Task::find($approval->approvable_id);
            if ($task && $task->project_id) {
                $link = "/dashboard/projects/{$task->project_id}?tab=tasks&task={$task->id}";
            } else {
                $link = "/dashboard/tasks";
            }
        }

        foreach ($targetUsers as $targetUser) {
            \App\Services\NotificationService::send(
                userId: $targetUser->id,
                type: 'approval_pending',
                title: 'New Approval Request',
                body: "{$submitter->name} has submitted a new {$type} request that requires your approval.",
                link: $link,
                priority: 'high'
            );
        }
    }
}
