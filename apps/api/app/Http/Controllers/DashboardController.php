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
                    return DB::table('audit_logs')
                        ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
                        ->select('audit_logs.id', 'audit_logs.action', 'audit_logs.subject_type',
                                 'audit_logs.subject_id', 'audit_logs.at', 'users.name as user_name', 'audit_logs.meta')
                        ->orderBy('audit_logs.at', 'desc')
                        ->limit(10)
                        ->get();
                });
            }

            if ($activeRole === 'hr') {
                $deptId = $user->department_id;
                
                if ($deptId) {
                    $deptUserIds = User::select('id')->where('department_id', $deptId);
                    $data['total_employees'] = $deptUserIds->count();
                    $data['active_employees'] = User::where('department_id', $deptId)->where('status', 'active')->count();
                    
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
                } else {
                    $data['total_employees'] = 0;
                    $data['active_employees'] = 0;
                    $data['present_today'] = 0;
                    $data['absent_today'] = 0;
                    $data['late_today'] = 0;
                    $data['leave_today'] = 0;
                    $data['pending_approvals'] = 0;
                }
                
                $data['pending_submissions'] = $hasTasks 
                    ? DB::table('tasks')->whereIn('assignee_id', $deptUserIds)->where('status', 'review')->count() 
                    : 0;
            }

            if ($activeRole === 'super_admin' || $activeRole === 'hr') {
                $data['active_projects'] = Cache::remember('dashboard_global', 300, function () {
                    return [
                        'total_employees' => User::count(),
                        'active_employees' => User::where('status', 'active')->count(),
                        'departments' => Department::count(),
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
                
                $data['recent_task_progress'] = [];
                $data['approval_status'] = [];
            }

            return $data;
        });

        return response()->json([
            'metrics' => $metrics,
            'role' => $activeRole
        ]);
    }
}
