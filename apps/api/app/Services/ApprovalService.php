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
        $activeRole = $user->resolveActiveRole();

        // Determine next approver role based on submitter's highest role
        $currentApproverRole = $activeRole === 'hr' ? 'super_admin' : 'hr';
        if ($approvable instanceof \App\Models\LeaveRequest && $activeRole === 'employee') {
            $currentApproverRole = 'hr';
        }
        if ($activeRole === 'super_admin') {
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
        if ($approval->submitted_by === $decidedBy) {
            abort(403, "You cannot decide on your own submission.");
        }

        $deciderActiveRole = User::findOrFail($decidedBy)->resolveActiveRole();
        
        // AUD-LEAVE-5: A super_admin can self-approve their own requests, as they are the highest escalation point.
        if ($deciderActiveRole === 'super_admin') {
            return;
        }

        if ($approval->current_approver_role !== $deciderActiveRole) {
            throw new AuthorizationException("User {$decidedBy} does not have the correct active role ({$approval->current_approver_role}) to decide this approval. Active role: {$deciderActiveRole}");
        }

        // Capability Matrix defense-in-depth check
        $requiredCap = null;
        switch ($approval->approvable_type) {
            case \App\Models\Project::class:
                $requiredCap = 'projects.manage';
                break;
            case \App\Models\Task::class:
                $requiredCap = 'tasks.manage';
                break;
            case \App\Models\LeaveRequest::class:
                $requiredCap = ($approval->current_approver_role === 'super_admin') ? 'leave.approve-hr' : 'leave.approve-employee';
                break;
        }
        
        if ($requiredCap && !CapabilityMatrix::hasCapability($deciderActiveRole, $requiredCap)) {
            abort(403, "Lacking required capability ({$requiredCap}) to approve request.");
        }
    }

    /**
     * Approve an existing pending approval.
     */
    public static function approve(Approval $approval, int $decidedBy, ?string $reason = null): Approval
    {
        if ($approval->status !== 'pending') {
            abort(400, "Approval is not in a pending state.");
        }

        if ($approval->submitted_by === $decidedBy) {
            abort(403, "You cannot approve your own request.");
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
                    $days = $leave->getWorkingDays();
                    $balance = \App\Models\LeaveBalance::getOrCreate($leave->user_id, $leave->type, (int) \Carbon\Carbon::parse($leave->start_date)->format('Y'));
                    $balance->increment('used', $days);
                    \App\Services\AttendanceService::markLeaveDays($leave->user_id, $leave->start_date, $leave->end_date);
                }
            }
        });

        DB::afterCommit(function () use ($approval) {
            try {
                event(new ApprovalDecided($approval));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to dispatch ApprovalDecided event: " . $e->getMessage());
            }
        });

        return $approval;
    }

    public static function reject(Approval $approval, int $decidedBy, string $reason): Approval
    {
        if ($approval->status !== 'pending') {
            abort(400, "Approval is not in a pending state.");
        }

        if ($approval->submitted_by === $decidedBy) {
            abort(403, "You cannot reject your own request.");
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
                    $wasApproved = $leave->status === 'approved';
                    $leave->update(['status' => 'rejected']);
                    if ($wasApproved) {
                        $days = $leave->getWorkingDays();
                        $balance = \App\Models\LeaveBalance::getOrCreate($leave->user_id, $leave->type, (int) \Carbon\Carbon::parse($leave->start_date)->format('Y'));
                        $balance->decrement('used', min($days, $balance->used));
                        
                        $startDate = \Carbon\Carbon::parse($leave->start_date);
                        $endDate = \Carbon\Carbon::parse($leave->end_date);
                        $currentDate = $startDate->copy();
                        while ($currentDate->lte($endDate)) {
                            \App\Services\AttendanceService::reconcileDay($leave->user_id, $currentDate->toDateString(), true);
                            $currentDate->addDay();
                        }
                    }
                }
            }
        });

        DB::afterCommit(function () use ($approval) {
            try {
                event(new ApprovalDecided($approval));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to dispatch ApprovalDecided event: " . $e->getMessage());
            }
        });

        return $approval;
    }

    /**
     * Mark an existing pending approval as redo required.
     */
    public static function redo(Approval $approval, int $decidedBy, string $reason): Approval
    {
        if ($approval->status !== 'pending') {
            abort(400, "Approval is not in a pending state.");
        }

        if ($approval->submitted_by === $decidedBy) {
            abort(403, "You cannot request a redo on your own request.");
        }

        self::checkRoleGating($approval, $decidedBy);

        DB::transaction(function () use ($approval, $decidedBy, $reason) {
            $approval->update([
                'status' => 'rejected', // Conceptually a rejection of the current submission
                'decision' => 'redo',
                'decided_by' => $decidedBy,
                'decided_at' => now(),
                'decision_reason' => $reason,
                'feedback' => $reason,
            ]);
        });

        DB::afterCommit(function () use ($approval) {
            try {
                event(new ApprovalDecided($approval));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to dispatch ApprovalDecided event: " . $e->getMessage());
            }
        });

        return $approval;
    }
}
