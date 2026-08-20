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
        $roles = $user->getCachedRoles();

        $query = LeaveRequest::with(['approval', 'user']);

        $isAdmin = in_array('super_admin', $roles);
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
                $q->where('reason', 'ilike', "%{$search}%")
                  ->orWhereHas('user', function($q2) use ($search) {
                      $q2->where('name', 'ilike', "%{$search}%")
                         ->orWhere('email', 'ilike', "%{$search}%");
                  });
            });
        }

        $query->orderBy('created_at', 'desc');

        $request->validate(['per_page' => 'nullable|integer|in:20,50,100']);
        $perPage = $request->input('per_page', 20);
        return response()->json($query->paginate($perPage));
    }

    private function calculateWorkingDays($user, $startDate, $endDate)
    {
        $days = 0;
        $current = $startDate->copy();
        
        $workSchedule = null;
        if ($user->work_schedule_id) {
            $workSchedule = \App\Models\WorkSchedule::find($user->work_schedule_id);
        }
        if (!$workSchedule) {
            $workSchedule = \App\Models\WorkSchedule::where('is_default', true)->first();
        }
        
        $workingDays = $workSchedule ? $workSchedule->working_days : [1, 2, 3, 4, 5]; // Default Mon-Fri
        if (!is_array($workingDays)) $workingDays = [1, 2, 3, 4, 5];
        
        $holidays = \App\Models\Holiday::whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])->pluck('date')->toArray();

        while ($current <= $endDate) {
            $isWorkingDay = in_array($current->isoWeekday(), $workingDays);
            $isHoliday = in_array($current->format('Y-m-d'), $holidays);
            
            if ($isWorkingDay && !$isHoliday) {
                $days++;
            }
            $current->addDay();
        }
        
        return $days;
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
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($overlap) {
            return response()->json(['message' => 'You already have a pending or approved leave request overlapping these dates.'], 422);
        }

        // Leave Balance check
        $startDate = \Carbon\Carbon::parse($validated['start_date']);
        $endDate = \Carbon\Carbon::parse($validated['end_date']);
        $requestedDays = $this->calculateWorkingDays($request->user(), $startDate, $endDate);
        
        if ($requestedDays === 0) {
            return response()->json(['message' => 'Requested date range does not contain any working days.'], 422);
        }

        $balance = \App\Models\LeaveBalance::getOrCreate($userId, $validated['type'], (int) $startDate->format('Y'));
        
        if (($balance->allowed - $balance->used) < $requestedDays) {
            $available = max(0, $balance->allowed - $balance->used);
            return response()->json([
                'message' => "Insufficient leave balance for requested {$validated['type']} leave. Available: {$available} day(s), Requested: {$requestedDays} day(s)."
            ], 422);
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
                return response()->json(['message' => 'You already have a pending or approved leave request overlapping these dates.'], 422);
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
            ->where(function ($query) use ($id) {
                $query->where('id', $id)->orWhere('approvable_id', $id);
            })
            ->firstOrFail();

        $user = $request->user();
        $leaveRequest = LeaveRequest::findOrFail($approval->approvable_id);

        if (!in_array('super_admin', $user->getCachedRoles()) && $leaveRequest->user_id !== $user->id) {
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
            } else {
                $approval = ApprovalService::reject($approval, $user->id, $validated['reason']);
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
            $admins = \App\Models\RoleAssignment::whereIn('role', ['super_admin', 'hr'])->pluck('user_id')->unique();
            foreach ($admins as $adminId) {
                \Illuminate\Support\Facades\Cache::forget("pending_approvals_{$adminId}_hr");
                \Illuminate\Support\Facades\Cache::forget("pending_approvals_{$adminId}_super_admin");
                \Illuminate\Support\Facades\Cache::forget("dashboard_init_{$adminId}_hr_{$today}");
                \Illuminate\Support\Facades\Cache::forget("dashboard_init_{$adminId}_super_admin_{$today}");
            }
            \Illuminate\Support\Facades\Cache::forget("pending_approvals_{$leaveRequest->user_id}_employee");
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

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('reason', 'ilike', "%{$search}%");
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
                $q->where('reason', 'ilike', "%{$search}%")
                  ->orWhereHas('user', function($q2) use ($search) {
                      $q2->where('name', 'ilike', "%{$search}%")
                         ->orWhere('email', 'ilike', "%{$search}%");
                  });
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
                \App\Support\HrScope::apply($q, $user);
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
        $job = \App\Models\ExportJob::create([
            'user_id' => $request->user()->id,
            'report_key' => 'leave-export',
            'format' => 'xlsx',
            'status' => 'pending',
            'filters' => [
                'status' => $request->query('status'),
                'type' => $request->query('type'),
                '_department_id' => $request->user()->department_id,
                '_user_id' => $request->user()->id,
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
        $roles = $user->getCachedRoles();
        $isHrOrAdmin = count(array_intersect(['hr', 'super_admin'], $roles)) > 0;

        if ($leave->user_id === $user->id) {
            // Employee can only cancel their own pending requests
            if ($leave->status !== 'pending') {
                return response()->json(['message' => 'You can only cancel pending leave requests.'], 403);
            }
            $leave->status = 'cancelled';
            $leave->save();
            return response()->json(['message' => 'Leave request cancelled successfully.']);
        } else if ($isHrOrAdmin) {
            // Admin/HR can delete
            if (!in_array('super_admin', $roles)) {
                // Ensure HR is authorized to manage this user
                if (!\App\Support\HrScope::apply(\App\Models\User::where('id', $leave->user_id), $user)->exists()) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }
            $leave->delete(); // Assuming we just hard delete or soft delete it
            return response()->json(['message' => 'Leave request deleted successfully.']);
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }
}

