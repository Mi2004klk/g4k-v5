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
    private function hasElevatedReportAccess(Request $request): bool
    {
        $role = $request->user()->resolveActiveRole();
        return CapabilityMatrix::hasCapability($role, 'reports.manage') || CapabilityMatrix::hasCapability($role, 'reports.view');
    }

    public function data(Request $request)
    {
        $key = $request->query('key', 'tasks');
        $hasManage = $this->hasElevatedReportAccess($request);
        $user = $request->user();

        switch ($key) {
            case 'tasks':
                $query = Task::with(['project', 'assignee']);
                if (!$hasManage) {
                    $query->where(function ($q) use ($user) {
                        $q->where('assignee_id', $user->id)
                          ->orWhere('reporter_id', $user->id)
                          ->orWhereHas('assignees', fn ($aq) => $aq->where('users.id', $user->id));
                    });
                } elseif ($user->resolveActiveRole() === 'hr') {
                    $deptIds = \App\Support\HrScope::managedDepartmentIds($user);
                    if (empty($deptIds)) {
                        $query->whereRaw('1 = 0');
                    } else {
                        $query->where(function ($q) use ($user, $deptIds) {
                            $q->whereHas('project', function($pq) use ($deptIds) {
                                  $pq->whereIn('department_id', $deptIds);
                              })
                              ->orWhereHas('assignees', function($aq) use ($deptIds) {
                                  $aq->whereIn('users.department_id', $deptIds);
                              })
                              ->orWhereHas('reporter', function($rq) use ($deptIds) {
                                  $rq->whereIn('users.department_id', $deptIds);
                              })
                              ->orWhere('assignee_id', $user->id)
                              ->orWhere('reporter_id', $user->id);
                        });
                    }
                }
                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->whereRaw('LOWER(title) LIKE LOWER(?)', ["%{$search}%"]);
                }
                $perPage = max(min((int) $request->query('per_page', 25), 100), 1);
                $data = $query->latest()->paginate($perPage);
                break;
            case 'projects':
                $query = Project::with(['creator', 'members']);
                if (!$hasManage) {
                    $query->where(function ($q) use ($user) {
                        $q->where('created_by', $user->id)
                          ->orWhereHas('members', fn ($m) => $m->where('users.id', $user->id));
                    });
                } else {
                    \App\Support\HrScope::apply($query, $user, 'department_id');
                }
                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->whereRaw('LOWER(name) LIKE LOWER(?)', ["%{$search}%"]);
                }
                $perPage = max(min((int) $request->query('per_page', 25), 100), 1);
                $data = $query->latest()->paginate($perPage);
                break;
            case 'users':
            case 'productivity':
            default:
                $query = User::query();
                if (!$hasManage) {
                    // Employee: own data only (not department-wide)
                    $query->where('id', $user->id);
                } else {
                    \App\Support\HrScope::apply($query, $user, 'users.department_id');
                }
                
                if ($key === 'productivity') {
                    $query->withCount([
                        'assignedTasks as completed_tasks' => function($q) {
                            $q->where('status', 'done');
                        },
                        'assignedTasks as redo_tasks' => function($q) {
                            $q->whereHas('approval', function($aq) {
                                $aq->where('decision', 'redo');
                            });
                        },
                        'assignedTasks as total_tasks'
                    ])->withSum('taskTimeLogs as total_minutes', 'minutes_logged');
                }

                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->whereRaw('LOWER(name) LIKE LOWER(?)', ["%{$search}%"]);
                }
                
                $perPage = max(min((int) $request->query('per_page', 25), 100), 1);
                $data = $query->latest()->paginate($perPage);

                if ($key === 'productivity') {
                    $data->getCollection()->transform(function($u) {
                        $taskCompletionRate = $u->total_tasks > 0 ? (($u->completed_tasks / $u->total_tasks) * 100) : 0;
                        $loggedHours = ($u->total_minutes ?? 0) / 60;
                        $timeScore = min(100, ($loggedHours / 160) * 100);
                        $u->productivity_score = round(($taskCompletionRate * 0.8) + ($timeScore * 0.2), 1);
                        
                        $redoRate = $u->total_tasks > 0 ? (($u->redo_tasks / $u->total_tasks) * 100) : 0;
                        $u->redo_rate = round($redoRate, 1);
                        $u->avg_time_per_task = $u->total_tasks > 0 ? round(($u->total_minutes ?? 0) / $u->total_tasks) : 0;

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
        $filters['_has_manage'] = $this->hasElevatedReportAccess($request);
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

        return response()->json($exports);
    }

    public function downloadExport(Request $request, $id)
    {
        $exportJob = ExportJob::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($exportJob->status !== 'completed') {
            abort(404, 'Export not ready');
        }

        if (!$exportJob->file_data && !$exportJob->file_path) {
            abort(404, 'Export file missing');
        }

        $contentType = 'application/octet-stream';
        if ($exportJob->format === 'pdf') $contentType = 'application/pdf';
        if ($exportJob->format === 'csv') $contentType = 'text/csv';
        if ($exportJob->format === 'xlsx') $contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        $filename = "export-{$exportJob->report_key}-{$exportJob->id}.{$exportJob->format}";

        if ($exportJob->file_path) {
            $disk = \Illuminate\Support\Facades\Storage::disk(config('filesystems.default'));
            if (!$disk->exists($exportJob->file_path)) {
                abort(404, 'Export file not found on disk');
            }
            return response()->streamDownload(function () use ($disk, $exportJob) {
                echo $disk->get($exportJob->file_path);
            }, $filename, ['Content-Type' => $contentType]);
        } else {
            $decoded = base64_decode($exportJob->file_data);
            return response($decoded, 200, [
                'Content-Type' => $contentType,
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        }
    }

    public function attendanceSummary(Request $request)
    {
        $start = $request->query('start', now()->subDays(30)->toDateString());
        $end = $request->query('end', now()->toDateString());
        $dept = $request->query('dept');
        $page = $request->query('page', 1);

        $hasManage = $this->hasElevatedReportAccess($request);
        $user = $request->user();

        // Also we need to include hasManage and user ID in the cache key so HR and Admin don't share the same cache!
        $cacheRole = $hasManage ? "admin_{$user->id}" : "u_{$user->id}";
        $perPage = max(min((int) $request->query('per_page', 25), 100), 1);
        $cacheKey = "report_attendance_summary_{$start}_{$end}_{$dept}_{$page}_{$perPage}_{$cacheRole}";

        $results = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($start, $end, $dept, $hasManage, $user, $perPage) {
            $query = User::query()
                ->with('department')
                ->withCount([
                    'attendanceDays as present_days' => fn($q) => $q->where('status', 'present')->whereBetween('date', [$start, $end]),
                    'attendanceDays as late_days' => fn($q) => $q->where('status', 'late')->whereBetween('date', [$start, $end]),
                    'attendanceDays as absent_days' => fn($q) => $q->where('status', 'absent')->whereBetween('date', [$start, $end]),
                    'attendanceDays as leave_days' => fn($q) => $q->where('status', 'on_leave')->whereBetween('date', [$start, $end]),
                ])
                ->withSum(['attendanceDays as total_hours' => fn($q) => $q->whereBetween('date', [$start, $end])], 'total_seconds')
                ->withSum(['attendanceDays as overtime_seconds' => fn($q) => $q->whereBetween('date', [$start, $end])], 'overtime_seconds');

            if (!$hasManage) {
                $query->where('id', $user->id);
            } else {
                \App\Support\HrScope::apply($query, $user);
                if ($dept && $dept !== 'all') {
                    $query->where('department_id', $dept);
                }
            }

            return $query->paginate($perPage);
        });

        return response()->json($results);
    }

    public function leaveSummary(Request $request)
    {
        $start = $request->query('start', now()->subDays(30)->toDateString());
        $end = $request->query('end', now()->toDateString());
        $dept = $request->query('dept');

        $page = $request->query('page', 1);

        $hasManage = $this->hasElevatedReportAccess($request);
        $user = $request->user();

        $cacheRole = $hasManage ? "admin_{$user->id}" : "u_{$user->id}";
        $perPage = max(min((int) $request->query('per_page', 25), 100), 1);
        $cacheKey = "report_leave_summary_{$start}_{$end}_{$dept}_{$page}_{$perPage}_{$cacheRole}";

        $results = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($start, $end, $dept, $hasManage, $user, $perPage) {
            $query = User::query()
                ->with('department')
                ->withCount([
                    'leaveRequests as total_requests' => fn($q) => $q->where('start_date', '<=', $end)->where('end_date', '>=', $start),
                    'leaveRequests as approved_requests' => fn($q) => $q->where('status', 'approved')->where('start_date', '<=', $end)->where('end_date', '>=', $start),
                    'leaveRequests as pending_requests' => fn($q) => $q->where('status', 'pending')->where('start_date', '<=', $end)->where('end_date', '>=', $start),
                    'leaveRequests as rejected_requests' => fn($q) => $q->where('status', 'rejected')->where('start_date', '<=', $end)->where('end_date', '>=', $start),
                    'leaveRequests as sick_requests' => fn($q) => $q->where('type', 'sick')->where('start_date', '<=', $end)->where('end_date', '>=', $start),
                    'leaveRequests as casual_requests' => fn($q) => $q->where('type', 'casual')->where('start_date', '<=', $end)->where('end_date', '>=', $start),
                    'leaveRequests as earned_requests' => fn($q) => $q->where('type', 'earned')->where('start_date', '<=', $end)->where('end_date', '>=', $start),
                    'leaveRequests as unpaid_requests' => fn($q) => $q->where('type', 'unpaid')->where('start_date', '<=', $end)->where('end_date', '>=', $start),
                ]);

            if (!$hasManage) {
                $query->where('id', $user->id);
            } else {
                \App\Support\HrScope::apply($query, $user);
                if ($dept && $dept !== 'all') {
                    $query->where('department_id', $dept);
                }
            }

            return $query->paginate($perPage);
        });

        return response()->json($results);
    }
}

