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
        
        $activeRole = 'employee';
        if ($user->currentAccessToken()) {
            foreach ($user->currentAccessToken()->abilities as $ability) {
                if (str_starts_with($ability, 'role:')) {
                    $activeRole = substr($ability, 5);
                    break;
                }
            }
        }

        $safeCall = function($controller, $method, $fallback = null) use ($request) {
            try {
                $res = app($controller)->$method($request);
                return method_exists($res, 'getData') ? $res->getData(true) : $res;
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("init() failed for {$controller}::{$method}: " . $e->getMessage());
                return $fallback;
            }
        };

        $cacheKey = "dashboard_init_{$user->id}_{$activeRole}_{$today}";
        
        $data = Cache::remember($cacheKey, 120, function() use ($user, $activeRole, $safeCall) {
            return [
                'metrics' => Cache::remember("user_metrics_{$user->id}_{$activeRole}", 300, fn() => $safeCall(DashboardController::class, 'metrics')['metrics'] ?? null),
                'preferences' => Cache::remember("user_prefs_{$user->id}", 300, fn() => $safeCall(UserPreferenceController::class, 'show')),
                'pending_approvals' => Cache::remember("pending_approvals_{$user->id}_{$activeRole}", 60, function() use ($activeRole) {
                    $approvals = [];
                    // Leaves
                    $leaves = DB::table('leave_requests')
                        ->join('users', 'leave_requests.user_id', '=', 'users.id')
                        ->where('leave_requests.status', 'pending')
                        ->select('leave_requests.id', 'leave_requests.created_at', 'users.name as user_name', 'leave_requests.reason as title')
                        ->get();
                    foreach ($leaves as $l) {
                        $approvals[] = [
                            'id' => $l->id,
                            'type' => 'leave',
                            'title' => $l->title ?? 'Leave Request',
                            'user_name' => $l->user_name,
                            'created_at' => $l->created_at,
                            'route' => '/attendance/leave/admin'
                        ];
                    }

                    // Tasks
                    if (Schema::hasTable('tasks')) {
                        $tasks = DB::table('tasks')
                            ->leftJoin('users', 'tasks.assignee_id', '=', 'users.id')
                            ->where('tasks.status', 'review')
                            ->select('tasks.id', 'tasks.created_at', 'users.name as user_name', 'tasks.title')
                            ->get();
                        foreach ($tasks as $t) {
                            $approvals[] = [
                                'id' => $t->id,
                                'type' => 'task',
                                'title' => $t->title,
                                'user_name' => $t->user_name ?? 'Unassigned',
                                'created_at' => $t->created_at,
                                'route' => '/tasks/' . $t->id
                            ];
                        }
                    }

                    // Projects
                    if (Schema::hasTable('projects')) {
                        $projects = DB::table('projects')
                            ->leftJoin('users', 'projects.owner_id', '=', 'users.id')
                            ->where('projects.status', 'pending_approval')
                            ->select('projects.id', 'projects.created_at', 'users.name as user_name', 'projects.name as title')
                            ->get();
                        foreach ($projects as $p) {
                            $approvals[] = [
                                'id' => $p->id,
                                'type' => 'project',
                                'title' => $p->title,
                                'user_name' => $p->user_name ?? 'Unassigned',
                                'created_at' => $p->created_at,
                                'route' => '/projects/' . $p->id
                            ];
                        }
                    }

                    usort($approvals, fn($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));
                    return array_slice($approvals, 0, 10); // Return top 10 recent approvals
                }),
                'pins' => Cache::remember("user_pins_{$user->id}", 300, fn() => $safeCall(PinController::class, 'index', [])),
                'announcements' => Cache::remember("announcements_all", 120, fn() => $safeCall(\App\Http\Controllers\AnnouncementController::class, 'index', [])),
                'quick_notes' => Cache::remember("quick_notes_{$user->id}", 120, fn() => $safeCall(\App\Http\Controllers\QuickNoteController::class, 'index', [])),
                'role' => $activeRole
            ];
        });

        // Exclude attendance_today from the outer cache due to volatility
        $data['attendance_today'] = $safeCall(AttendanceController::class, 'meToday');

        return response()->json($data);
    }

    public function metrics(Request $request)
    {
        $user = $request->user();
        $activeRole = 'employee';
        
        if ($user->currentAccessToken()) {
            foreach ($user->currentAccessToken()->abilities as $ability) {
                if (str_starts_with($ability, 'role:')) {
                    $activeRole = substr($ability, 5);
                    break;
                }
            }
        }

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
                        SUM(CASE WHEN status = \'leave\' THEN 1 ELSE 0 END) as on_leave
                    ')
                    ->first();
                    
                $data['present_today'] = (int) ($attendance->present ?? 0);
                $data['absent_today'] = (int) ($attendance->absent ?? 0);
                $data['late_today'] = (int) ($attendance->late ?? 0);
                $data['leave_today'] = (int) ($attendance->on_leave ?? 0);
                
                $data['pending_approvals'] = $hasLeaveRequests ? DB::table('leave_requests')->where('status', 'pending')->count() : 0;
                
                // Shared admin recent activity cache
                $data['recent_activity'] = Cache::remember('dashboard_recent_activity', 300, function () {
                    $raw = DB::table('audit_logs')
                        ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
                        ->select('audit_logs.id', 'audit_logs.action', 'audit_logs.subject_type',
                                 'audit_logs.subject_id', 'audit_logs.at', 'audit_logs.ip', 'users.name as user_name', 'audit_logs.after')
                        ->whereNotIn('audit_logs.action', ['login', 'logout', 'viewed'])
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
                $deptIds = \App\Support\HrScope::managedDepartmentIds($user);
                
                $deptUserIds = empty($deptIds) 
                    ? User::select('id') 
                    : User::select('id')->whereIn('department_id', $deptIds);

                $data['total_employees'] = $deptUserIds->count();
                
                $activeQuery = User::where('status', 'active');
                if (!empty($deptIds)) {
                    $activeQuery->whereIn('department_id', $deptIds);
                }
                $data['active_employees'] = $activeQuery->count();
                
                $attendance = DB::table('attendance_days')
                    ->whereIn('user_id', $deptUserIds)
                    ->where('date', $today)
                    ->selectRaw('
                        SUM(CASE WHEN status = \'present\' THEN 1 ELSE 0 END) as present,
                        SUM(CASE WHEN status = \'absent\' THEN 1 ELSE 0 END) as absent,
                        SUM(CASE WHEN status = \'late\' THEN 1 ELSE 0 END) as late,
                        SUM(CASE WHEN status = \'leave\' THEN 1 ELSE 0 END) as on_leave
                    ')
                    ->first();
                    
                $data['present_today'] = (int) ($attendance->present ?? 0);
                $data['absent_today'] = (int) ($attendance->absent ?? 0);
                $data['late_today'] = (int) ($attendance->late ?? 0);
                $data['leave_today'] = (int) ($attendance->on_leave ?? 0);
                
                $data['pending_approvals'] = $hasLeaveRequests ? DB::table('leave_requests')->whereIn('user_id', $deptUserIds)->where('status', 'pending')->count() : 0;
                
                $data['pending_submissions'] = $hasTasks 
                    ? DB::table('tasks')->whereIn('assignee_id', $deptUserIds)->where('status', 'review')->count() 
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
                    ? DB::table('tasks')->where('assignee_id', $user->id)->whereIn('status', ['todo', 'in_progress', 'review'])->count() : 0;
                $data['completed_tasks'] = $hasTasks
                    ? DB::table('tasks')->where('assignee_id', $user->id)->where('status', 'done')->count() : 0;
            }
                
            if ($activeRole === 'employee') {
                $todayStatus = DB::table('attendance_days')
                    ->where('user_id', $user->id)
                    ->where('date', $today)
                    ->value('status');
                $data['my_today_status'] = $todayStatus ?? 'absent';
                $data['pending_approvals'] = $hasLeaveRequests
                    ? DB::table('leave_requests')->where('user_id', $user->id)->where('status', 'pending')->count()
                    : 0;
                
                $recentTask = null;
                if ($hasTasks) {
                    $recentTask = DB::table('tasks')
                        ->where('assignee_id', $user->id)
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
