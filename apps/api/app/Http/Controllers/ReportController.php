<?php

namespace App\Http\Controllers;

use App\Models\ExportJob;
use App\Models\Task;
use App\Models\Project;
use App\Models\User;
use App\Jobs\GenerateReportJob;
use App\Services\CapabilityMatrix;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    private function userHasManage(Request $request): bool
    {
        $role = $request->user()->active_role ?? 'employee';
        return CapabilityMatrix::hasCapability($role, 'reports.manage');
    }

    public function data(Request $request)
    {
        $key = $request->query('key', 'tasks');
        $hasManage = $this->userHasManage($request);
        $user = $request->user();

        switch ($key) {
            case 'tasks':
                $query = Task::with(['project', 'assignee']);
                if (!$hasManage) {
                    $query->where(function ($q) use ($user) {
                        $q->where('assignee_id', $user->id)
                          ->orWhere('reporter_id', $user->id);
                    });
                }
                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->where('title', 'ilike', "%{$search}%");
                }
                $data = $query->latest()->paginate(25);
                break;
            case 'projects':
                $query = Project::with(['creator', 'members']);
                if (!$hasManage) {
                    $query->where(function ($q) use ($user) {
                        $q->where('created_by', $user->id)
                          ->orWhereHas('members', fn ($m) => $m->where('users.id', $user->id));
                    });
                }
                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->where('name', 'ilike', "%{$search}%");
                }
                $data = $query->latest()->paginate(25);
                break;
            case 'users':
            case 'productivity':
            default:
                $query = User::query();
                if (!$hasManage) {
                    // Employee: own data only (not department-wide)
                    $query->where('id', $user->id);
                }
                
                if ($key === 'productivity') {
                    $query->withCount([
                        'assignedTasks as completed_tasks' => function($q) {
                            $q->where('status', 'done');
                        },
                        'assignedTasks as total_tasks'
                    ])->withSum('taskTimeLogs as total_minutes', 'minutes_logged');
                }

                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->where('name', 'ilike', "%{$search}%");
                }
                
                $data = $query->latest()->paginate(25);

                if ($key === 'productivity') {
                    $data->getCollection()->transform(function($u) {
                        $taskCompletionRate = $u->total_tasks > 0 ? (($u->completed_tasks / $u->total_tasks) * 100) : 0;
                        $loggedHours = ($u->total_minutes ?? 0) / 60;
                        $timeScore = min(100, ($loggedHours / 160) * 100);
                        $u->productivity_score = round(($taskCompletionRate * 0.8) + ($timeScore * 0.2), 1);
                        return $u;
                    });
                }
                break;
        }

        return response()->json($data);
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|in:tasks,projects,users,productivity,attendance-summary,leave-summary',
            'format' => 'required|in:xlsx,csv,pdf',
            'filters' => 'nullable|array',
        ]);

        $filters = $validated['filters'] ?? [];
        $filters['_has_manage'] = $this->userHasManage($request);
        $filters['_department_id'] = $request->user()->department_id;
        $filters['_user_id'] = $request->user()->id;

        $exportJob = ExportJob::create([
            'user_id' => $request->user()->id,
            'report_key' => $validated['key'],
            'format' => $validated['format'],
            'filters' => $filters,
            'status' => 'pending',
        ]);

        // Process job synchronously or queue depending on config
        GenerateReportJob::dispatch($exportJob);

        return response()->json($exportJob, 202);
    }

    public function exports(Request $request)
    {
        $exports = ExportJob::where('user_id', $request->user()->id)
            ->latest()
            ->limit(20)
            ->get();

        return response()->json(['data' => $exports]);
    }

    public function attendanceSummary(Request $request)
    {
        $start = $request->query('start', now()->subDays(30)->toDateString());
        $end = $request->query('end', now()->toDateString());
        $dept = $request->query('dept');
        $page = $request->query('page', 1);

        $hasManage = $this->userHasManage($request);
        $user = $request->user();

        // Also we need to include hasManage and user ID in the cache key so HR and Admin don't share the same cache!
        $cacheRole = $hasManage ? 'admin' : "hr_{$user->department_id}";
        $cacheKey = "report_attendance_summary_{$start}_{$end}_{$dept}_{$page}_{$cacheRole}";

        $results = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($start, $end, $dept, $hasManage, $user) {
            $query = User::query()
                ->with('department')
                ->withCount([
                    'attendanceDays as present_days' => fn($q) => $q->where('status', 'present')->whereBetween('date', [$start, $end]),
                    'attendanceDays as late_days' => fn($q) => $q->where('status', 'late')->whereBetween('date', [$start, $end]),
                    'attendanceDays as absent_days' => fn($q) => $q->where('status', 'absent')->whereBetween('date', [$start, $end]),
                    'attendanceDays as leave_days' => fn($q) => $q->where('status', 'leave')->whereBetween('date', [$start, $end]),
                ])
                ->withSum(['attendanceDays as total_hours' => fn($q) => $q->whereBetween('date', [$start, $end])], 'total_seconds')
                ->withSum(['attendanceDays as overtime_seconds' => fn($q) => $q->whereBetween('date', [$start, $end])], 'overtime_seconds');

            if (!$hasManage) {
                $query->where('id', $user->id);
            } elseif ($dept && $dept !== 'all') {
                $query->where('department_id', $dept);
            }

            return $query->paginate(25);
        });

        return response()->json($results);
    }

    public function leaveSummary(Request $request)
    {
        $start = $request->query('start', now()->subDays(30)->toDateString());
        $end = $request->query('end', now()->toDateString());
        $dept = $request->query('dept');

        $hasManage = $this->userHasManage($request);
        $user = $request->user();

        $query = User::query()
            ->with('department')
            ->withCount([
                'leaveRequests as total_requests' => fn($q) => $q->where('start_date', '<=', $end)->where('end_date', '>=', $start),
                'leaveRequests as approved_requests' => fn($q) => $q->where('status', 'approved')->where('start_date', '<=', $end)->where('end_date', '>=', $start),
                'leaveRequests as pending_requests' => fn($q) => $q->where('status', 'pending')->where('start_date', '<=', $end)->where('end_date', '>=', $start),
                'leaveRequests as rejected_requests' => fn($q) => $q->where('status', 'rejected')->where('start_date', '<=', $end)->where('end_date', '>=', $start),
            ]);

        if (!$hasManage) {
            $query->where('id', $user->id);
        } elseif ($dept && $dept !== 'all') {
            $query->where('department_id', $dept);
        }

        return response()->json($query->paginate(25));
    }
}
