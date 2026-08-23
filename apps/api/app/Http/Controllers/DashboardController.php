<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Department;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function init(Request $request)
    {
        $user = $request->user();
        $today = Carbon::now()->toDateString();
        
        $activeRole = $user->resolveActiveRole();

        $safeCall = function($controller, $method, $fallback = null) use ($request) {
            try {
                $res = app($controller)->$method($request);
                $data = method_exists($res, 'getData') ? $res->getData(true) : $res;
                if (is_array($data) && count($data) === 1 && isset($data['data'])) {
                    return $data['data'];
                }
                return $data;
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("init() failed for {$controller}::{$method}: " . $e->getMessage());
                return $fallback;
            }
        };

        $cacheKey = "dashboard_init_{$user->id}_{$activeRole}_{$today}";
        
        $data = Cache::remember($cacheKey, 120, function() use ($user, $activeRole, $safeCall) {
            return [
                'metrics' => Cache::remember("user_metrics_{$user->id}_{$activeRole}", 30, fn() => $safeCall(DashboardController::class, 'metrics')['metrics'] ?? null),
                'preferences' => Cache::remember("user_prefs_{$user->id}", 300, fn() => $safeCall(UserPreferenceController::class, 'show')),
                'pending_approvals' => Cache::remember("pending_approvals_{$user->id}_{$activeRole}", 60, function() use ($activeRole, $user) {
                    $approvals = [];
                    // Leaves
                    $leavesQuery = DB::table('leave_requests')
                        ->join('users', 'leave_requests.user_id', '=', 'users.id')
                        ->leftJoin('approvals', function($join) {
                            $join->on('approvals.approvable_id', '=', 'leave_requests.id')
                                 ->where('approvals.approvable_type', '=', 'App\\Models\\LeaveRequest');
                        })
                        ->where('leave_requests.status', 'pending')
                        ->select(
                            'leave_requests.id as leave_request_id',
                            'approvals.id as approval_id',
                            'leave_requests.created_at',
                            'users.name as user_name',
                            'leave_requests.reason as title'
                        );
                        
                    if ($activeRole === 'employee') {
                        $leavesQuery->where('leave_requests.user_id', $user->id);
                    } elseif ($activeRole === 'hr') {
                        \App\Support\HrScope::apply($leavesQuery, $user, 'leave_requests.user_id');
                    }
                    
                    $leaves = $leavesQuery->get();

                    foreach ($leaves as $l) {
                        $route = '/dashboard/attendance?tab=leave';
                        if ($activeRole === 'super_admin' || $activeRole === 'hr') {
                            $route = '/dashboard/org/attendance?tab=leave&sub=approvals';
                        }
                        
                        $approvals[] = [
                            'id' => $l->approval_id ?? $l->leave_request_id,
                            'leave_request_id' => $l->leave_request_id,
                            'approval_id' => $l->approval_id,
                            'type' => 'on_leave',
                            'title' => $l->title ?? 'Leave Request',
                            'user_name' => $l->user_name,
                            'created_at' => $l->created_at,
                            'route' => $route
                        ];
                    }

                    // Tasks
                    if (Schema::hasTable('tasks')) {
                        $tasksQuery = DB::table('tasks')
                            ->leftJoin('users', 'tasks.assignee_id', '=', 'users.id')
                            ->where('tasks.status', 'review')
                            ->select('tasks.id', 'tasks.created_at', 'users.name as user_name', 'tasks.title');
                            
                        if ($activeRole === 'employee') {
                            $tasksQuery->where(function($q) use ($user) {
                                $q->where('tasks.assignee_id', $user->id)
                                  ->orWhereExists(function ($q2) use ($user) {
                                      $q2->select(DB::raw(1))->from('task_assignees')
                                         ->whereColumn('task_assignees.task_id', 'tasks.id')
                                         ->where('task_assignees.user_id', $user->id);
                                  });
                            });
                        } elseif ($activeRole === 'hr') {
                            $tasksQuery->where(function($q) use ($user) {
                                $q->whereExists(function ($q2) use ($user) {
                                    $q2->select(DB::raw(1))->from('users')
                                       ->whereColumn('users.id', 'tasks.assignee_id');
                                    \App\Support\HrScope::apply($q2, $user, 'department_id');
                                })
                                ->orWhereExists(function ($q2) use ($user) {
                                    $q2->select(DB::raw(1))->from('task_assignees')
                                       ->join('users', 'users.id', '=', 'task_assignees.user_id')
                                       ->whereColumn('task_assignees.task_id', 'tasks.id');
                                    \App\Support\HrScope::apply($q2, $user, 'users.department_id');
                                });
                            });
                        }
                        
                        $tasks = $tasksQuery->get();
                        
                        foreach ($tasks as $t) {
                            $approvals[] = [
                                'id' => $t->id,
                                'type' => 'task',
                                'title' => $t->title,
                                'user_name' => $t->user_name ?? 'Unassigned',
                                'created_at' => $t->created_at,
                                'action_url' => '/dashboard/tasks/' . $t->id
                            ];
                        }
                    }

                    // Projects
                    if (Schema::hasTable('projects')) {
                        $projectsQuery = DB::table('projects')
                            ->leftJoin('users', 'projects.created_by', '=', 'users.id')
                            ->where('projects.status', 'review')
                            ->select('projects.id', 'projects.created_at', 'users.name as user_name', 'projects.name as title');
                            
                        if ($activeRole === 'employee') {
                            $projectsQuery->where(function($q) use ($user) {
                                $q->where('projects.created_by', $user->id)
                                  ->orWhereExists(function ($q2) use ($user) {
                                      $q2->select(DB::raw(1))
                                         ->from('project_members')
                                         ->whereColumn('project_members.project_id', 'projects.id')
                                         ->where('project_members.user_id', $user->id);
                                  });
                            });
                        } elseif ($activeRole === 'hr') {
                            // Projects can be scoped by created_by or project_members.
                            // To be safe:
                            $projectsQuery->where(function($q) use ($user) {
                                $q->whereExists(function ($q2) use ($user) {
                                    $q2->select(DB::raw(1))->from('users')
                                       ->whereColumn('users.id', 'projects.created_by');
                                    \App\Support\HrScope::apply($q2, $user, 'department_id');
                                })
                                ->orWhereExists(function ($q2) use ($user) {
                                    $q2->select(DB::raw(1))->from('project_members')
                                       ->join('users', 'users.id', '=', 'project_members.user_id')
                                       ->whereColumn('project_members.project_id', 'projects.id');
                                    \App\Support\HrScope::apply($q2, $user, 'users.department_id');
                                });
                            });
                        }
                        
                        $projects = $projectsQuery->get();
                        
                        foreach ($projects as $p) {
                            $approvals[] = [
                                'id' => $p->id,
                                'type' => 'project',
                                'title' => $p->title,
                                'user_name' => $p->user_name ?? 'Unassigned',
                                'created_at' => $p->created_at,
                                'action_url' => '/dashboard/projects/' . $p->id
                            ];
                        }
                    }

                    usort($approvals, fn($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));
                    return array_slice($approvals, 0, 10); // Return top 10 recent approvals
                }),
                'announcements' => Cache::remember("announcements_{$user->id}_{$activeRole}", 120, fn() => $safeCall(\App\Http\Controllers\AnnouncementController::class, 'index', [])),
                'quick_notes' => Cache::remember("quick_notes_{$user->id}", 120, fn() => $safeCall(\App\Http\Controllers\QuickNoteController::class, 'index', [])),
                'role' => $activeRole
            ];
        });

        // Exclude attendance_today from the outer cache due to volatility
        $data['attendance_today'] = $safeCall(AttendanceController::class, 'meToday');
        $data['active_task'] = \Illuminate\Support\Facades\Cache::get("user_active_task_{$user->id}");

        return response()->json($data);
    }
    /**
     * Dashboard Metrics Contract
     * 
     * Provided keys per role:
     * - super_admin: total_employees, active_employees, inactive_employees, departments, present_today, absent_today, late_today, leave_today, pending_approvals, active_projects, pending_tasks
     * - hr: total_employees (scoped), active_employees (scoped), present_today (scoped), absent_today (scoped), late_today (scoped), leave_today (scoped), pending_approvals (scoped), pending_submissions (scoped), active_projects (global), pending_tasks (global)
     * - employee: active_projects (scoped), pending_tasks (scoped), completed_tasks (scoped), my_today_status, pending_approvals (self)
     */
    public function metrics(Request $request)
    {
        $user = $request->user();
        $activeRole = $user->resolveActiveRole();

        $today = Carbon::now()->toDateString();
        $cacheKey = "dashboard_metrics_{$user->id}_{$activeRole}_{$today}";

        $metrics = Cache::remember($cacheKey, 300, function () use ($user, $activeRole, $today) {
            $data = [];

            // Modules are confirmed to exist in production
            $hasProjects = true;
            $hasProjectMembers = true;
            $hasTasks = true;
            $hasLeaveRequests = true;

            $data['has_projects_module'] = $hasProjects;
            $data['has_tasks_module'] = $hasTasks;

            if ($activeRole === 'super_admin') {
                // Shared role-agnostic global stats
                $globalStats = Cache::remember('dashboard_global', 300, function () {
                    return [
                        'total_employees' => User::count(),
                        'active_employees' => User::where('status', 'active')->count(),
                        'departments' => Department::count(),
                        'active_projects' => DB::table('projects')->where('status', 'active')->count(),
                    ];
                });
                $data['total_employees'] = $globalStats['total_employees'];
                $data['active_employees'] = $globalStats['active_employees'];
                $data['inactive_employees'] = $globalStats['total_employees'] - $globalStats['active_employees'];
                $data['departments'] = $globalStats['departments'];

                $attendance = DB::table('attendance_days')
                    ->where('date', $today)
                    ->selectRaw('
                        SUM(CASE WHEN status = \'present\' THEN 1 ELSE 0 END) as present,
                        SUM(CASE WHEN status = \'absent\' THEN 1 ELSE 0 END) as absent,
                        SUM(CASE WHEN status = \'late\' THEN 1 ELSE 0 END) as late,
                        SUM(CASE WHEN status = \'on_leave\' THEN 1 ELSE 0 END) as on_leave
                    ')
                    ->first();
                    
                $data['present_today'] = (int) ($attendance->present ?? 0);
                $data['absent_today'] = (int) ($attendance->absent ?? 0);
                $data['late_today'] = (int) ($attendance->late ?? 0);
                $data['leave_today'] = (int) ($attendance->on_leave ?? 0);
                
                $leaveCount = $hasLeaveRequests ? DB::table('leave_requests')->where('status', 'pending')->count() : 0;
                $projectReviewCount = DB::table('projects')->where('status', 'review')->count();
                $data['pending_approvals'] = $leaveCount + $projectReviewCount;
                
                // Shared admin recent activity cache
                $data['recent_activity'] = Cache::remember('dashboard_recent_activity', 300, function () {
                    $raw = DB::table('audit_logs')
                        ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
                        ->select('audit_logs.id', 'audit_logs.action', 'audit_logs.subject_type',
                                 'audit_logs.subject_id', 'audit_logs.at', 'audit_logs.ip', 'users.name as user_name', 'audit_logs.after')
                        ->whereNotIn('audit_logs.action', ['login', 'logout', 'viewed'])
                        ->where('audit_logs.action', 'not like', 'attendance.%')
                        ->where('audit_logs.action', '!=', 'correct_event')
                        ->orderBy('audit_logs.at', 'desc')
                        ->limit(15)
                        ->get();

                    return $raw->map(function ($log) {
                        return [
                            'id' => $log->id,
                            'action' => $log->action,
                            'subject_type' => class_basename($log->subject_type ?? ''),
                            'subject_id' => $log->subject_id,
                            'at' => $log->at,
                            'user_name' => $log->user_name,
                            'after' => $log->after
                        ];
                    });
                });
            }

            if ($activeRole === 'hr') {
                $usersQuery = User::query();
                \App\Support\HrScope::apply($usersQuery, $user);
                $data['total_employees'] = $usersQuery->count();
                
                $activeQuery = User::where('status', 'active');
                \App\Support\HrScope::apply($activeQuery, $user);
                $data['active_employees'] = $activeQuery->count();
                
                $attendanceQuery = DB::table('attendance_days')
                    ->where('date', $today)
                    ->selectRaw('
                        SUM(CASE WHEN status = \'present\' THEN 1 ELSE 0 END) as present,
                        SUM(CASE WHEN status = \'absent\' THEN 1 ELSE 0 END) as absent,
                        SUM(CASE WHEN status = \'late\' THEN 1 ELSE 0 END) as late,
                        SUM(CASE WHEN status = \'on_leave\' THEN 1 ELSE 0 END) as on_leave
                    ');
                \App\Support\HrScope::apply($attendanceQuery, $user, 'user_id');
                $attendance = $attendanceQuery->first();
                    
                $data['present_today'] = (int) ($attendance->present ?? 0);
                $data['absent_today'] = (int) ($attendance->absent ?? 0);
                $data['late_today'] = (int) ($attendance->late ?? 0);
                $data['leave_today'] = (int) ($attendance->on_leave ?? 0);
                
                $leaveQuery = DB::table('leave_requests')->where('status', 'pending');
                \App\Support\HrScope::apply($leaveQuery, $user, 'user_id');
                $leaveCount = $hasLeaveRequests ? $leaveQuery->count() : 0;
                
                $projectReviewQuery = DB::table('projects')->where('status', 'review');
                if ($activeRole === 'hr') {
                    $projectReviewQuery->where(function($q) use ($user) {
                        $q->whereExists(function ($q2) use ($user) {
                            $q2->select(DB::raw(1))->from('users')
                               ->whereColumn('users.id', 'projects.created_by');
                            \App\Support\HrScope::apply($q2, $user, 'department_id');
                        })
                        ->orWhereExists(function ($q2) use ($user) {
                            $q2->select(DB::raw(1))->from('project_members')
                               ->join('users', 'users.id', '=', 'project_members.user_id')
                               ->whereColumn('project_members.project_id', 'projects.id');
                            \App\Support\HrScope::apply($q2, $user, 'users.department_id');
                        });
                    });
                }
                $projectReviewCount = $projectReviewQuery->count();
                $data['pending_approvals'] = $leaveCount + $projectReviewCount;
                
                $data['pending_submissions'] = $hasTasks 
                    ? DB::table('tasks')
                        ->where('status', 'review')
                        ->where(function ($q) use ($user) {
                             $q->whereExists(function ($q2) use ($user) {
                                 $q2->select(DB::raw(1))->from('users')
                                    ->whereColumn('users.id', 'tasks.assignee_id');
                                 \App\Support\HrScope::apply($q2, $user, 'department_id');
                             })
                             ->orWhereExists(function ($q2) use ($user) {
                                 $q2->select(DB::raw(1))->from('task_assignees')
                                    ->join('users', 'users.id', '=', 'task_assignees.user_id')
                                    ->whereColumn('task_assignees.task_id', 'tasks.id');
                                 \App\Support\HrScope::apply($q2, $user, 'users.department_id');
                             });
                        })->count() 
                    : 0;
            }

            if ($activeRole === 'super_admin' || $activeRole === 'hr') {
                $data['active_projects'] = Cache::remember('dashboard_global', 300, function () {
                    return [
                        'total_employees' => User::count(),
                        'active_employees' => User::where('status', 'active')->count(),
                        'departments' => \App\Models\Department::count(),
                        'active_projects' => DB::table('projects')->where('status', 'active')->count(),
                    ];
                })['active_projects'];
                $data['pending_tasks'] = $hasTasks
                    ? DB::table('tasks')->whereIn('status', ['todo', 'in_progress', 'review'])->count() : 0;
            } elseif ($activeRole === 'employee') {
                $data['active_projects'] = ($hasProjects && $hasProjectMembers)
                    ? DB::table('project_members')
                        ->join('projects', 'project_members.project_id', '=', 'projects.id')
                        ->where('project_members.user_id', $user->id)
                        ->where('projects.status', 'active')
                        ->count() : 0;
                $data['pending_tasks'] = $hasTasks
                    ? DB::table('tasks')->where(function($q) use ($user) {
                          $q->where('assignee_id', $user->id)
                            ->orWhereExists(function ($q2) use ($user) {
                                $q2->select(DB::raw(1))->from('task_assignees')
                                   ->whereColumn('task_assignees.task_id', 'tasks.id')
                                   ->where('task_assignees.user_id', $user->id);
                            });
                      })->whereIn('status', ['todo', 'in_progress', 'review'])->count() : 0;
                $data['completed_tasks'] = $hasTasks
                    ? DB::table('tasks')->where(function($q) use ($user) {
                          $q->where('assignee_id', $user->id)
                            ->orWhereExists(function ($q2) use ($user) {
                                $q2->select(DB::raw(1))->from('task_assignees')
                                   ->whereColumn('task_assignees.task_id', 'tasks.id')
                                   ->where('task_assignees.user_id', $user->id);
                            });
                      })->where('status', 'done')->count() : 0;
            }
                
            if ($activeRole === 'employee') {
                $todayStatus = DB::table('attendance_days')
                    ->where('user_id', $user->id)
                    ->where('date', $today)
                    ->value('status');
                $data['my_today_status'] = $todayStatus ?? 'absent';
                $leaveCount = $hasLeaveRequests
                    ? DB::table('leave_requests')->where('user_id', $user->id)->where('status', 'pending')->count()
                    : 0;
                $projectReviewCount = DB::table('projects')
                    ->join('project_members', 'projects.id', '=', 'project_members.project_id')
                    ->where('project_members.user_id', $user->id)
                    ->where('projects.status', 'review')
                    ->count();
                $data['pending_approvals'] = $leaveCount + $projectReviewCount;
                
                $recentTask = null;
                if ($hasTasks) {
                    $recentTask = DB::table('tasks')
                        ->where(function($q) use ($user) {
                            $q->where('assignee_id', $user->id)
                              ->orWhereExists(function ($q2) use ($user) {
                                  $q2->select(DB::raw(1))->from('task_assignees')
                                     ->whereColumn('task_assignees.task_id', 'tasks.id')
                                     ->where('task_assignees.user_id', $user->id);
                              });
                        })
                        ->orderBy('updated_at', 'desc')
                        ->first();
                }
                
                $recentTaskProgress = [];
                if ($recentTask) {
                    $progress = $recentTask->progress ?? 0;
                    $recentTaskProgress = [
                        [
                            'id' => $recentTask->id,
                            'title' => $recentTask->title,
                            'progress' => $progress,
                            'status' => $recentTask->status,
                            'updated_at' => $recentTask->updated_at,
                        ]
                    ];
                }
                
                $data['recent_task_progress'] = $recentTaskProgress;
                $data['approval_status'] = []; // Handled separately via /tasks/submitted endpoint in frontend
            }

            return $data;
        });

        return response()->json([
            'metrics' => $metrics,
            'role' => $activeRole
        ]);
    }
}

