<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\User;
use App\Events\ApprovalDecided;
use App\Events\ApprovalSubmitted;
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
        $currentApproverRole = in_array('hr', $roles) ? 'super_admin' : 'hr';
        if (in_array('super_admin', $roles)) {
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

        event(new ApprovalSubmitted($approval));

        return $approval;
    }

    private static function checkRoleGating(Approval $approval, int $decidedBy)
    {
        $deciderRoles = DB::table('role_assignments')->where('user_id', $decidedBy)->pluck('role')->toArray();
        if (!in_array($approval->current_approver_role, $deciderRoles) && !in_array('super_admin', $deciderRoles)) {
            throw new Exception("You do not have the correct active role ({$approval->current_approver_role}) to decide this approval.");
        }
    }

    /**
     * Approve an existing pending approval.
     */
    public static function approve(Approval $approval, int $decidedBy, ?string $reason = null): Approval
    {
        if ($approval->status !== 'pending') {
            throw new Exception("Approval is not in a pending state.");
        }

        self::checkRoleGating($approval, $decidedBy);

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

        self::checkRoleGating($approval, $decidedBy);

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
