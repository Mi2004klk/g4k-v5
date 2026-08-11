<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\User;
use App\Events\ApprovalDecided;
use App\Events\ApprovalSubmitted;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Auth\Access\AuthorizationException;

class ApprovalService
{
    /**
     * Submit an entity for approval.
     */
    public static function submit(\Illuminate\Database\Eloquent\Model $approvable, int $submittedBy, ?array $payload = null): Approval
    {
        $user = User::findOrFail($submittedBy);
        $roles = $user->getCachedRoles();

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
        $deciderRoles = \App\Models\RoleAssignment::getRolesForUser($decidedBy);
        if (!in_array($approval->current_approver_role, $deciderRoles) && !in_array('super_admin', $deciderRoles)) {
            $rolesStr = implode(', ', $deciderRoles);
            throw new AuthorizationException("User {$decidedBy} does not have the correct active role ({$approval->current_approver_role}) to decide this approval. Roles found: {$rolesStr}");
        }

        // Capability Matrix defense-in-depth check
        $requiredCap = ($approval->current_approver_role === 'super_admin') ? 'leave.approve-hr' : 'leave.approve-employee';
        $hasCap = false;
        foreach ($deciderRoles as $role) {
            if (CapabilityMatrix::hasCapability($role, $requiredCap) || $role === 'super_admin') {
                $hasCap = true;
                break;
            }
        }
        if (!$hasCap) {
            throw new Exception("Lacking required capability ({$requiredCap}) to approve request.");
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

        if ($approval->submitted_by === $decidedBy) {
            throw new Exception("You cannot approve your own request.");
        }

        self::checkRoleGating($approval, $decidedBy);

        DB::transaction(function () use ($approval, $decidedBy, $reason) {
            $approval->update([
                'status' => 'approved',
                'decision' => 'approved',
                'decided_by' => $decidedBy,
                'decided_at' => now(),
                'decision_reason' => $reason,
            ]);

            if ($approval->approvable_type === \App\Models\LeaveRequest::class) {
                $leave = \App\Models\LeaveRequest::find($approval->approvable_id);
                if ($leave) {
                    $leave->update(['status' => 'approved']);
                }
            }
        });

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

        if ($approval->submitted_by === $decidedBy) {
            throw new Exception("You cannot reject your own request.");
        }

        self::checkRoleGating($approval, $decidedBy);

        DB::transaction(function () use ($approval, $decidedBy, $reason) {
            $approval->update([
                'status' => 'rejected',
                'decision' => 'rejected',
                'decided_by' => $decidedBy,
                'decided_at' => now(),
                'decision_reason' => $reason,
            ]);

            if ($approval->approvable_type === \App\Models\LeaveRequest::class) {
                $leave = \App\Models\LeaveRequest::find($approval->approvable_id);
                if ($leave) {
                    $leave->update(['status' => 'rejected']);
                }
            }
        });

        event(new ApprovalDecided($approval));

        return $approval;
    }
}
