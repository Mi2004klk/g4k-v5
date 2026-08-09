<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\User;
use App\Events\ApprovalDecided;
use Exception;
use Illuminate\Support\Facades\DB;

class ApprovalService
{
    /**
     * Submit an entity for approval.
     */
    public static function submit(\Illuminate\Database\Eloquent\Model $approvable, int $submittedBy, ?array $payload = null): Approval
    {
        $user = User::findOrFail($submittedBy);
        $roles = DB::table('role_assignments')->where('user_id', $user->id)->pluck('role')->toArray();

        // Determine next approver role based on submitter's highest role
        // super_admin -> auto-approved? Or maybe not allowed? Assuming super_admin can auto-approve their own or doesn't need to.
        // For now, if hr -> super_admin. Otherwise -> hr.
        $currentApproverRole = in_array('hr', $roles) ? 'super_admin' : 'hr';
        if (in_array('super_admin', $roles)) {
            // Super admins can just approve their own stuff directly if needed, but we'll set it to super_admin anyway
            $currentApproverRole = 'super_admin';
        }

        $approval = Approval::create([
            'approvable_type' => get_class($approvable),
            'approvable_id' => $approvable->id,
            'status' => 'pending',
            'submitted_by' => $submittedBy,
            'current_approver_role' => $currentApproverRole,
            'payload' => $payload,
        ]);

        return $approval;
    }

    /**
     * Approve an existing pending approval.
     */
    public static function approve(Approval $approval, int $decidedBy, ?string $reason = null): Approval
    {
        if ($approval->status !== 'pending') {
            throw new Exception("Approval is not in a pending state.");
        }

        // Capability checking is done in the controller or middleware.
        // Assuming controller already checked capability based on $approval->current_approver_role.

        $approval->update([
            'status' => 'approved',
            'decision' => 'approved',
            'decided_by' => $decidedBy,
            'decided_at' => now(),
            'decision_reason' => $reason,
        ]);

        event(new ApprovalDecided($approval));

        return $approval;
    }

    /**
     * Reject an existing pending approval.
     */
    public static function reject(Approval $approval, int $decidedBy, string $reason): Approval
    {
        if ($approval->status !== 'pending') {
            throw new Exception("Approval is not in a pending state.");
        }

        $approval->update([
            'status' => 'rejected',
            'decision' => 'rejected',
            'decided_by' => $decidedBy,
            'decided_at' => now(),
            'decision_reason' => $reason,
        ]);

        event(new ApprovalDecided($approval));

        return $approval;
    }
}
