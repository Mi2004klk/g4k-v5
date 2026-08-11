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

    public function index(Request $request)
    {
        $user = $request->user();
        $roles = $user->getCachedRoles();

        $query = LeaveRequest::with(['approval', 'user']);

        // Scope
        if (in_array('super_admin', $roles)) {
            // Admin sees all
        } elseif (in_array('hr', $roles)) {
            $query->where(function($q) use ($user) {
                $q->whereHas('approval', function($q2) {
                    $q2->where('current_approver_role', 'hr');
                })->whereHas('user', function($q3) use ($user) {
                    $q3->where('department_id', $user->department_id);
                })->orWhere('user_id', $user->id);
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
            'status' => 'pending',
        ]);

        $approval = ApprovalService::submit($leave, $userId, $validated);

        $leave->update(['approval_id' => $approval->id]);

        \App\Services\AuditLogger::log($request, 'leave.request', 'LeaveRequest', $leave->id, null, $validated);

        return response()->json($leave->load('approval'), 201);
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

        if ($validated['decision'] === 'approved') {
            $approval = ApprovalService::approve($approval, $user->id, $validated['reason'] ?? null);
        } else {
            $approval = ApprovalService::reject($approval, $user->id, $validated['reason']);
        }

        return response()->json($approval);
    }

    public function show(Request $request, $id)
    {
        $leave = LeaveRequest::with(['approval', 'user'])->findOrFail($id);
        
        $user = $request->user();
        $roles = $user->getCachedRoles();
        $isHrOrAdmin = count(array_intersect(['hr', 'super_admin'], $roles)) > 0;

        if ($leave->user_id !== $user->id && !$isHrOrAdmin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($leave);
    }

    public function history(Request $request)
    {
        $query = LeaveRequest::with(['approval'])
            ->where('user_id', $request->user()->id);

        if ($request->filled('status')) {
            $status = $request->query('status');
            $query->whereHas('approval', function($q) use ($status) {
                $q->where('status', $status);
            });
        }
        
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('start_date')) {
            $query->where('start_date', '>=', $request->query('start_date'));
        }

        $query->orderBy('start_date', 'desc');

        return response()->json($query->cursorPaginate(20));
    }

    public function pending(Request $request)
    {
        $user = $request->user();
        $roles = $user->getCachedRoles();

        $query = LeaveRequest::with(['approval', 'user'])->where('status', 'pending');

        if (in_array('super_admin', $roles)) {
            // Can see all pending
        } elseif (in_array('hr', $roles)) {
            $query->whereHas('user', function($q) use ($user) {
                $q->where('department_id', $user->department_id);
            });
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query->orderBy('created_at', 'asc');

        return response()->json($query->cursorPaginate(20));
    }

    public function export(Request $request)
    {
        $user = $request->user();
        $roles = $user->getCachedRoles();

        $query = LeaveRequest::with(['approval', 'user']);

        if (in_array('super_admin', $roles)) {
            // Admin sees all
        } elseif (in_array('hr', $roles)) {
            $query->whereHas('user', function($q) use ($user) {
                $q->where('department_id', $user->department_id);
            });
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
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

        // get() removed for streaming

        return response()->streamDownload(function () use ($query) {
            $writer = \Spatie\SimpleExcel\SimpleExcelWriter::streamDownload('leave_requests_export.xlsx');
            
            foreach ($query->cursor() as $leave) {
                $writer->addRow([
                    'ID' => $leave->id,
                    'Employee Name' => $leave->user->name ?? 'Unknown',
                    'Employee Email' => $leave->user->email ?? 'Unknown',
                    'Leave Type' => ucfirst($leave->type),
                    'Start Date' => $leave->start_date,
                    'End Date' => $leave->end_date,
                    'Reason' => $leave->reason,
                    'Status' => ucfirst($leave->approval->status ?? 'pending'),
                    'Submitted At' => $leave->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            $writer->close();
        }, "leave_requests_export_" . now()->format('Y_m_d') . ".xlsx");
    }
}
