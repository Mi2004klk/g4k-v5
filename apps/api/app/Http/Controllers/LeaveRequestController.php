<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LeaveRequest;
use App\Models\Approval;
use App\Services\ApprovalService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\StoreLeaveRequestRequest;


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
                    $q3->whereIn('department_id', \App\Support\HrScope::managedDepartmentIds($user));
                })->orWhere('user_id', $user->id);
            });
        } else {
            // Employee sees own
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $status = $request->query('status');
            $query->where('status', $status);
        }
        
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('user_id')) {
            // Additional check to ensure they have permission to see this user's leave
            if (in_array('super_admin', $roles) || in_array('hr', $roles)) {
                $query->where('user_id', $request->query('user_id'));
            }
        }

        $query->orderBy('created_at', 'desc');

        $request->validate(['per_page' => 'nullable|integer|in:20,50,100']);
        $perPage = $request->input('per_page', 20);
        return response()->json($query->paginate($perPage));
    }

    public function store(StoreLeaveRequestRequest $request)
    {
        $validated = $request->validated();

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
            ->where('status', 'pending')
            ->exists();

        if ($overlap) {
            return response()->json(['message' => 'You already have a pending leave request overlapping these dates.'], 422);
        }

        try {
            $leave = DB::transaction(function() use ($userId, $validated) {
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

                return $leave;
            });
        } catch (\Illuminate\Database\QueryException $e) {
            // Error code 23505 for unique violation in Postgres or 23000/1062 in MySQL
            if (in_array($e->getCode(), ['23505', '23000', '1062'])) {
                return response()->json(['message' => 'You already have a pending leave request overlapping these dates.'], 422);
            }
            throw $e;
        }

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

        $leaveRequest = LeaveRequest::find($id);
        if ($leaveRequest) {
            \Illuminate\Support\Facades\Cache::forget("pending_approvals_{$user->id}_hr");
            \Illuminate\Support\Facades\Cache::forget("pending_approvals_{$user->id}_super_admin");
            \Illuminate\Support\Facades\Cache::forget("pending_approvals_{$leaveRequest->user_id}_employee");
            
            $today = \Carbon\Carbon::now()->toDateString();
            \Illuminate\Support\Facades\Cache::forget("dashboard_init_{$user->id}_hr_{$today}");
            \Illuminate\Support\Facades\Cache::forget("dashboard_init_{$user->id}_super_admin_{$today}");
            \Illuminate\Support\Facades\Cache::forget("dashboard_init_{$leaveRequest->user_id}_employee_{$today}");
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

        $request->validate(['per_page' => 'nullable|integer|in:20,50,100']);
        $perPage = $request->input('per_page', 20);
        return response()->json($query->paginate($perPage));
    }

    public function adminHistory(Request $request)
    {
        $user = $request->user();
        $roles = $user->getCachedRoles();
        
        if (!in_array('hr', $roles) && !in_array('super_admin', $roles)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = LeaveRequest::with(['approval', 'user']);

        if (!in_array('super_admin', $roles)) {
            $query->whereHas('user', function($q) use ($user) {
                $q->whereIn('department_id', \App\Support\HrScope::managedDepartmentIds($user));
            });
        }

        if ($request->filled('status')) {
            $status = $request->query('status');
            if ($status !== 'all') {
                $query->whereHas('approval', function($q) use ($status) {
                    $q->where('status', $status);
                });
            }
        }
        
        if ($request->filled('type') && $request->query('type') !== 'all') {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->whereHas('user', function($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        $query->orderBy('start_date', 'desc');

        $request->validate(['per_page' => 'nullable|integer|in:20,50,100']);
        $perPage = $request->input('per_page', 20);
        return response()->json($query->paginate($perPage));
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
                $q->whereIn('department_id', \App\Support\HrScope::managedDepartmentIds($user));
            });
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query->orderBy('created_at', 'asc');

        $request->validate(['per_page' => 'nullable|integer|in:20,50,100']);
        $perPage = $request->input('per_page', 20);
        return response()->json($query->paginate($perPage));
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
                $q->whereIn('department_id', \App\Support\HrScope::managedDepartmentIds($user));
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
