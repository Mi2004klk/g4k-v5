<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LeaveRequest;
use App\Models\Approval;
use App\Services\ApprovalService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LeaveRequestController extends Controller
{
    public function __construct()
    {
        $this->middleware('capability:employee.leave.request-self')->only(['store', 'index']);
        $this->middleware('capability:hr.leave.approve-employee|admin.leave.approve-hr')->only(['decision']);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $roles = DB::table('role_assignments')->where('user_id', $user->id)->pluck('role')->toArray();

        $query = LeaveRequest::with(['approval', 'user']);

        // Scope
        if (in_array('super_admin', $roles)) {
            // Admin sees all
        } elseif (in_array('hr', $roles)) {
            // HR sees team (employees) + own
            // Simplified: hr sees all where submitted by employee or themselves. 
            // Better yet, HR sees approvals where current_approver_role = 'hr' or user_id = self.
            $query->whereHas('approval', function($q) use ($user) {
                $q->where('current_approver_role', 'hr')->orWhere('submitted_by', $user->id);
            });
        } else {
            // Employee sees own
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $status = $request->query('status');
            $query->whereHas('approval', function($q) use ($status) {
                $q->where('status', $status);
            });
        }
        
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        $query->orderBy('created_at', 'desc');

        return response()->json($query->cursorPaginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
            'type' => 'required|in:casual,sick,earned,unpaid',
        ]);

        $userId = $request->user()->id;

        // Check for pending overlaps
        $overlap = LeaveRequest::where('user_id', $userId)
            ->where(function ($q) use ($validated) {
                $q->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                  ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                  ->orWhere(function ($q2) use ($validated) {
                      $q2->where('start_date', '<=', $validated['start_date'])
                         ->where('end_date', '>=', $validated['end_date']);
                  });
            })
            ->whereHas('approval', function ($q) {
                $q->where('status', 'pending');
            })->exists();

        if ($overlap) {
            return response()->json(['message' => 'You already have a pending leave request overlapping these dates.'], 422);
        }

        $leave = LeaveRequest::create([
            'user_id' => $userId,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'reason' => $validated['reason'],
            'type' => $validated['type'],
        ]);

        $approval = ApprovalService::submit($leave, $userId, $validated);

        $leave->update(['approval_id' => $approval->id]);

        return response()->json($leave->load('approval'));
    }

    public function decision(Request $request, $id)
    {
        $validated = $request->validate([
            'decision' => 'required|in:approved,rejected',
            'reason' => 'required_if:decision,rejected|string|nullable',
        ]);

        $approval = Approval::where('approvable_type', LeaveRequest::class)
            ->where('approvable_id', $id)
            ->firstOrFail();

        $user = $request->user();
        $roles = DB::table('role_assignments')->where('user_id', $user->id)->pluck('role')->toArray();

        // Check if user is the correct approver role
        if (!in_array($approval->current_approver_role, $roles)) {
            // Wait, super_admin can approve HR leaves (current_approver_role = super_admin). 
            // Admin can approve anything if they are super_admin.
            if (!in_array('super_admin', $roles)) {
                return response()->json(['message' => 'You are not authorized to decide on this request.'], 403);
            }
        }

        if ($validated['decision'] === 'approved') {
            $approval = ApprovalService::approve($approval, $user->id, $validated['reason'] ?? null);
        } else {
            $approval = ApprovalService::reject($approval, $user->id, $validated['reason']);
        }

        // Notify submitter
        \App\Services\NotificationService::send(
            $approval->submitted_by,
            'leave_decision',
            'Leave Request ' . ucfirst($validated['decision']),
            'Your leave request has been ' . $validated['decision'] . '.',
            ['approval_id' => $approval->id, 'decision' => $validated['decision']],
            '/dashboard/leave'
        );

        return response()->json($approval);
    }
}
