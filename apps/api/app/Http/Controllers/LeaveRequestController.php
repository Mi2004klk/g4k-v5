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
    public function balance(Request $request)
    {
        $userId = $request->user()->id;
        $year = (int) date('Y');
        
        $types = ['casual', 'sick', 'earned', 'unpaid'];
        $balances = [];
        
        foreach ($types as $type) {
            $balance = \App\Models\LeaveBalance::getOrCreate($userId, $type, $year);
            $balances[$type] = [
                'allowed' => $balance->allowed,
                'used' => $balance->used,
                'available' => max(0, $balance->allowed - $balance->used)
            ];
        }
        
        return response()->json($balances);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $activeRole = $user->resolveActiveRole();

        $query = LeaveRequest::with(['approval', 'user']);

        $isAdmin = $activeRole === 'super_admin';
        $isHR = \App\Services\CapabilityMatrix::hasCapability($user->resolveActiveRole(), 'leave.approve-employee');

        // Scope
        if ($isAdmin) {
            // Admin sees all
        } elseif ($isHR) {
            $query->where(function($q) use ($user) {
                $q->whereHas('approval', function($q2) {
                    $q2->where('current_approver_role', 'hr');
                })->whereHas('user', function($q3) use ($user) {
                    \App\Support\HrScope::apply($q3, $user);
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
            if ($isAdmin || $isHR) {
                $query->where('user_id', $request->query('user_id'));
            }
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(reason) LIKE LOWER(?)', ["%{$search}%"])
                  ->orWhereHas('user', function($q2) use ($search) {
                      $q2->whereRaw('LOWER(name) LIKE LOWER(?)', ["%{$search}%"])
                         ->orWhereRaw('LOWER(email) LIKE LOWER(?)', ["%{$search}%"]);
                  });
            });
        }

        $query->orderBy('created_at', 'desc');

        $request->validate(['per_page' => 'nullable|integer|in:20,50,100,1000']);
        $perPage = $request->input('per_page', 20);
        return response()->json($query->paginate($perPage));
    }


    public function store(StoreLeaveRequestRequest $request)
    {
        $validated = $request->validated();

        $userId = $request->user()->id;

        // Overlap check moved inside the transaction to prevent race conditions.

        // Leave Balance check
        $startDate = \Carbon\Carbon::parse($validated['start_date']);
        $endDate = \Carbon\Carbon::parse($validated['end_date']);
        $requestedDays = \App\Models\LeaveRequest::calculateWorkingDays($request->user(), $startDate, $endDate);
        
        if ($requestedDays === 0) {
            return response()->json(['message' => 'Requested date range does not contain any working days.'], 422);
        }

        $balance = \App\Models\LeaveBalance::getOrCreate($userId, $validated['type'], (int) $startDate->format('Y'));
        
        if ($validated['type'] !== 'unpaid' && ($balance->allowed - $balance->used) < $requestedDays) {
            $available = max(0, $balance->allowed - $balance->used);
            return response()->json([
                'message' => "Insufficient leave balance for requested {$validated['type']} leave. Available: {$available} day(s), Requested: {$requestedDays} day(s)."
            ], 422);
        }

        try {
            $leave = DB::transaction(function() use ($userId, $validated) {
                // Lock user to prevent race conditions for overlapping leave requests
                \App\Models\User::where('id', $userId)->lockForUpdate()->first();

                // Check for pending overlaps inside the lock
                $overlap = LeaveRequest::where('user_id', $userId)
                    ->where(function ($q) use ($validated) {
                        $q->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                          ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                          ->orWhere(function ($q2) use ($validated) {
                              $q2->where('start_date', '<=', $validated['start_date'])
                                 ->where('end_date', '>=', $validated['end_date']);
                          });
                    })
                    ->whereIn('status', ['pending', 'approved'])
                    ->exists();
        
                if ($overlap) {
                    throw new \Exception('OVERLAP_ERROR');
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

                return $leave;
            });
        } catch (\Exception $e) {
            if ($e->getMessage() === 'OVERLAP_ERROR') {
                return response()->json(['message' => 'You already have a pending or approved leave request overlapping these dates.'], 422);
            }
            if ($e instanceof \Illuminate\Database\QueryException && in_array($e->getCode(), ['23505', '23000', '1062'])) {
                return response()->json(['message' => 'You already have a pending or approved leave request overlapping these dates.'], 422);
            }
            throw $e;
        }

        \App\Services\AuditLogger::log($request, 'leave.request', 'LeaveRequest', $leave->id, null, $validated);

        return response()->json($leave->load('approval'), 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string',
            'type' => 'required|in:casual,sick,earned,unpaid',
        ]);

        $leave = LeaveRequest::findOrFail($id);

        $user = $request->user();
        $activeRole = $user->resolveActiveRole();
        $isHrOrAdmin = in_array($activeRole, ['hr', 'super_admin']);

        // Only HR or super_admin can edit leaves
        if (!$isHrOrAdmin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only pending leaves can be edited
        if ($leave->status !== 'pending') {
            return response()->json(['message' => 'Only pending leaves can be edited.'], 422);
        }

        $userId = $leave->user_id;

        // Check Working Days
        $targetUser = \App\Models\User::find($userId);
        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        
        $requestedDays = \App\Support\WorkingDayCalculator::calculate($targetUser, $startDate->toDateString(), $endDate->toDateString());
        if ($requestedDays === 0) {
            return response()->json(['message' => 'Requested date range does not contain any working days.'], 422);
        }

        $balance = \App\Models\LeaveBalance::getOrCreate($userId, $validated['type'], (int) $startDate->format('Y'));
        
        if ($validated['type'] !== 'unpaid' && ($balance->allowed - $balance->used) < $requestedDays) {
            $available = max(0, $balance->allowed - $balance->used);
            return response()->json([
                'message' => "Insufficient leave balance for requested {$validated['type']} leave. Available: {$available} day(s), Requested: {$requestedDays} day(s)."
            ], 422);
        }

        try {
            DB::transaction(function() use ($userId, $validated, $leave) {
                \App\Models\User::where('id', $userId)->lockForUpdate()->first();

                $overlap = LeaveRequest::where('user_id', $userId)
                    ->where('id', '!=', $leave->id)
                    ->where(function ($q) use ($validated) {
                        $q->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                          ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                          ->orWhere(function ($q2) use ($validated) {
                              $q2->where('start_date', '<=', $validated['start_date'])
                                 ->where('end_date', '>=', $validated['end_date']);
                          });
                    })
                    ->whereIn('status', ['pending', 'approved'])
                    ->exists();
        
                if ($overlap) {
                    throw new \Exception('OVERLAP_ERROR');
                }

                $leave->update([
                    'start_date' => $validated['start_date'],
                    'end_date' => $validated['end_date'],
                    'reason' => $validated['reason'],
                    'type' => $validated['type'],
                ]);
            });
        } catch (\Exception $e) {
            if ($e->getMessage() === 'OVERLAP_ERROR' || (isset($e->errorInfo) && in_array($e->getCode(), ['23505', '23000', '1062']))) {
                return response()->json(['message' => 'User already has a pending or approved leave request overlapping these dates.'], 422);
            }
            throw $e;
        }

        \App\Services\AuditLogger::log($request, 'leave.update', 'LeaveRequest', $leave->id, null, $validated);

        return response()->json($leave->load('approval'));
    }

    public function decision(Request $request, $id)
    {
        $validated = $request->validate([
            'decision' => 'required|in:approved,rejected',
            'reason' => 'nullable|string|max:1000',
        ]);

        $leaveRequest = LeaveRequest::with('approval')->findOrFail($id);
        $approval = $leaveRequest->approval;
        
        if (!$approval) {
             return response()->json(['message' => 'No pending approval found for this leave request.'], 404);
        }

        $user = $request->user();

        if ($leaveRequest->user_id === $user->id) {
            return response()->json(['message' => 'You cannot approve or reject your own leave request.'], 403);
        }

        $activeRole = $user->resolveActiveRole();
        if ($activeRole !== 'super_admin' && $approval->current_approver_role !== $activeRole) {
            return response()->json(['message' => 'You are not authorized to make a decision at this stage.'], 403);
        }

        if ($activeRole !== 'super_admin' && $leaveRequest->user_id !== $user->id) {
            $targetUser = \App\Models\User::find($leaveRequest->user_id);
            if ($targetUser) {
                if (!\App\Support\HrScope::apply(\App\Models\User::where('id', $targetUser->id), $user)->exists()) {
                    return response()->json(['message' => 'Unauthorized: Employee is not in your managed departments'], 403);
                }
            }
        }

        DB::beginTransaction();
        try {
            if ($validated['decision'] === 'approved') {
                $approval = ApprovalService::approve($approval, $user->id, $validated['reason'] ?? null);
                \App\Services\AuditLogger::log($request, 'approve', 'LeaveRequest', $leaveRequest->id, null, ['reason' => $validated['reason'] ?? null]);
            } else {
                $approval = ApprovalService::reject($approval, $user->id, $validated['reason']);
                \App\Services\AuditLogger::log($request, 'reject', 'LeaveRequest', $leaveRequest->id, null, ['reason' => $validated['reason']]);
            }

            DB::commit();
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 403);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to process decision: ' . $e->getMessage()], 500);
        }

        if ($leaveRequest) {
            $today = \Carbon\Carbon::now()->toDateString();
            \App\Services\DashboardCacheService::invalidateGlobal();
        }

        return response()->json($approval);
    }

    public function show(Request $request, $id)
    {
        $leave = LeaveRequest::with(['approval.decider', 'user'])->findOrFail($id);
        
        $user = $request->user();
        $activeRole = $user->resolveActiveRole();
        $isHrOrAdmin = in_array($activeRole, ['hr', 'super_admin']);

        if ($leave->user_id !== $user->id && !$isHrOrAdmin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($activeRole !== 'super_admin' && $leave->user_id !== $user->id) {
            $targetUser = \App\Models\User::find($leave->user_id);
            if ($targetUser) {
                if (!\App\Support\HrScope::apply(\App\Models\User::where('id', $targetUser->id), $user)->exists()) {
                    return response()->json(['message' => 'Unauthorized: Employee is not in your managed departments'], 403);
                }
            }
        }

        return response()->json($leave);
    }

    public function history(Request $request)
    {
        $user = $request->user();
        $query = LeaveRequest::with(['approval']);

        if ($request->filled('user_id') && $request->query('user_id') != $user->id) {
            $targetUserId = $request->query('user_id');
            $activeRole = $user->resolveActiveRole();
            
            if ($activeRole !== 'super_admin') {
                if (!\App\Support\HrScope::apply(\App\Models\User::where('id', $targetUserId), $user)->exists()) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }
            $query->where('user_id', $targetUserId);
        } else {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $status = $request->query('status');
            $query->where('status', $status);
        }
        
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('start_date')) {
            $query->where('start_date', '>=', $request->query('start_date'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->whereRaw('LOWER(reason) LIKE LOWER(?)', ["%{$search}%"]);
        }

        $query->orderBy('start_date', 'desc');

        $request->validate(['per_page' => 'nullable|integer|in:20,50,100,1000']);
        $perPage = $request->input('per_page', 20);
        return response()->json($query->paginate($perPage));
    }

    public function adminHistory(Request $request)
    {
        $user = $request->user();
        $activeRole = $user->resolveActiveRole();
        
        if (!in_array($activeRole, ['hr', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = LeaveRequest::with(['approval.decider', 'user']);

        if ($activeRole !== 'super_admin') {
            $query->whereHas('user', function($q) use ($user) {
                \App\Support\HrScope::apply($q, $user);
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
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(reason) LIKE LOWER(?)', ["%{$search}%"])
                  ->orWhereHas('user', function($q2) use ($search) {
                      $q2->whereRaw('LOWER(name) LIKE LOWER(?)', ["%{$search}%"])
                         ->orWhereRaw('LOWER(email) LIKE LOWER(?)', ["%{$search}%"]);
                  });
            });
        }

        $query->orderBy('start_date', 'desc');

        $request->validate(['per_page' => 'nullable|integer|in:20,50,100,1000']);
        $perPage = $request->input('per_page', 20);
        return response()->json($query->paginate($perPage));
    }

    public function pending(Request $request)
    {
        $user = $request->user();
        $activeRole = $user->resolveActiveRole();

        $query = LeaveRequest::with(['approval.decider', 'user.leaveBalances'])->where('status', 'pending');

        if ($activeRole === 'super_admin') {
            // Can see all pending
        } elseif ($activeRole === 'hr') {
            $query->whereHas('user', function($q) use ($user) {
                \App\Support\HrScope::apply($q, $user);
            });
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query->orderBy('created_at', 'asc');

        $request->validate(['per_page' => 'nullable|integer|in:20,50,100,1000']);
        $perPage = $request->input('per_page', 20);
        return response()->json($query->paginate($perPage));
    }

    public function export(Request $request)
    {
        $user = $request->user();
        $activeRole = $user->resolveActiveRole();
        $hasManage = $activeRole === 'super_admin' || \App\Services\CapabilityMatrix::hasCapability($activeRole, 'leave.approve-employee');

        $job = \App\Models\ExportJob::create([
            'user_id' => $request->user()->id,
            'report_key' => 'leave-export',
            'format' => 'xlsx',
            'status' => 'pending',
            'filters' => [
                'status' => $request->query('status'),
                'type' => $request->query('type'),
                '_department_id' => $user->department_id,
                '_user_id' => $user->id,
                '_has_manage' => $hasManage,
            ],
        ]);

        dispatch(new \App\Jobs\GenerateReportJob($job));

        return response()->json([
            'message' => 'Export started. You will be notified when it is ready.',
            'job_id' => $job->id,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $leave = LeaveRequest::findOrFail($id);
        
        $user = $request->user();
        $activeRole = $user->resolveActiveRole();
        $isHrOrAdmin = in_array($activeRole, ['hr', 'super_admin']);

        if ($leave->user_id === $user->id) {
            if ($leave->status !== 'pending') {
                return response()->json(['message' => 'Only pending leave requests can be cancelled.'], 403);
            }
            $leave->status = 'cancelled';
            $leave->save();
            
            \App\Models\Approval::where('approvable_type', get_class($leave))
                ->where('approvable_id', $leave->id)
                ->update(['status' => 'resolved', 'decision' => 'cancelled']);

            // Notify the manager/approver if the leave had an approver
            $approval = $leave->approval;
            $approverIds = [];
            if ($approval && $approval->decided_by) {
                $approverIds[] = $approval->decided_by;
            } else {
                $targetUser = \App\Models\User::find($leave->user_id);
                if ($targetUser) {
                    if ($approval && $approval->current_approver_role === 'manager' && $targetUser->manager_id) {
                        $approverIds[] = $targetUser->manager_id;
                    } elseif ($targetUser->department_id) {
                        $hrUsers = \App\Models\User::whereHas('roleAssignments', function($q) {
                            $q->where('role', 'hr');
                        })->where('department_id', $targetUser->department_id)->pluck('id')->toArray();
                        $approverIds = $hrUsers;
                    }
                }
            }

            foreach ($approverIds as $approverId) {
                \App\Services\NotificationService::send(
                    $approverId,
                    'info',
                    'Leave Cancelled',
                    "{$user->name} has cancelled their leave request for {$leave->start_date}.",
                    ['leave_id' => $leave->id],
                    '/dashboard/org/attendance',
                    'normal'
                );
            }

            \App\Services\DashboardCacheService::invalidateGlobal();

            return response()->json(['message' => 'Leave request cancelled successfully.']);
        } else if ($isHrOrAdmin) {
            // Admin/HR can delete
            if ($activeRole !== 'super_admin') {
                // Ensure HR is authorized to manage this user
                if (!\App\Support\HrScope::apply(\App\Models\User::where('id', $leave->user_id), $user)->exists()) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }
            
            $wasApproved = $leave->status === 'approved';
            $leave->status = 'cancelled';
            $leave->save();
            
            \App\Models\Approval::where('approvable_type', get_class($leave))
                ->where('approvable_id', $leave->id)
                ->update(['status' => 'resolved', 'decision' => 'cancelled']);
            
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
            
            \App\Support\AuditLogger::log($request, 'cancel', 'leave_request', $leave->id, null, ['reason' => 'Administratively cancelled via destroy endpoint']);
            
            \App\Services\NotificationService::send(
                $leave->user_id,
                'info',
                'Leave Cancelled',
                "Your leave request for {$leave->start_date} was cancelled by an administrator.",
                ['leave_id' => $leave->id],
                '/dashboard/leave',
                'normal'
            );

            \App\Services\DashboardCacheService::invalidateGlobal();

            return response()->json(['message' => 'Leave request cancelled successfully.']);
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }
}

