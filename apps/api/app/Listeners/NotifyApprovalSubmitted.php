<?php

namespace App\Listeners;

use App\Events\ApprovalSubmitted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
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

        foreach ($targetUsers as $targetUser) {
            Notification::create([
                'user_id' => $targetUser->id,
                'type' => 'approval_pending',
                'title' => 'New Approval Request',
                'body' => "{$submitter->name} has submitted a new {$approval->approvable_type} request that requires your approval.",
                'link' => '/dashboard/org/leave',
            ]);
        }
    }
}
