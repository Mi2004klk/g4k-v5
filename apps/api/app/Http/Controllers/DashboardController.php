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
    private static array $schemaCache = [];

    private function hasTable(string $table): bool
    {
        if (!isset(self::$schemaCache[$table])) {
            self::$schemaCache[$table] = Cache::remember("schema_has_{$table}", 3600, fn() => Schema::hasTable($table));
        }
        return self::$schemaCache[$table];
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

            // Module schema availability checks (cached)
            $hasProjects = $this->hasTable('projects');
            $hasProjectMembers = $this->hasTable('project_members');
            $hasTasks = $this->hasTable('tasks');
            $hasLeaveRequests = $this->hasTable('leave_requests');

            $data['has_projects_module'] = $hasProjects;
            $data['has_tasks_module'] = $hasTasks;

            if ($activeRole === 'super_admin') {
                // Shared role-agnostic global stats
                $globalStats = Cache::remember("dashboard_global_stats", 300, function () {
                    return [
                        'total_employees' => User::count(),
                        'active_employees' => User::where('status', 'active')->count(),
                        'departments' => Department::count(),
                    ];
                });
                $data = array_merge($data, $globalStats);

                $attendance = DB::table('attendance_days')
                    ->where('date', $today)
                    ->selectRaw('
                        SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present,
                        SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent,
                        SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) as late,
                        SUM(CASE WHEN status = "leave" THEN 1 ELSE 0 END) as on_leave
                    ')
                    ->first();
                    
                $data['present_today'] = (int) ($attendance->present ?? 0);
                $data['absent_today'] = (int) ($attendance->absent ?? 0);
                $data['late_today'] = (int) ($attendance->late ?? 0);
                $data['leave_today'] = (int) ($attendance->on_leave ?? 0);
                
                $data['pending_approvals'] = $hasLeaveRequests ? DB::table('leave_requests')->where('status', 'pending')->count() : 0;
                
                // Shared admin recent activity cache
                $data['recent_activity'] = Cache::remember("dashboard_recent_activity", 300, function () {
                    return DB::table('audit_logs')->orderBy('at', 'desc')->limit(10)->get();
                });
            }

            if ($activeRole === 'hr') {
                $deptId = $user->department_id;
                
                if ($deptId) {
                    $deptUserIds = User::where('department_id', $deptId)->pluck('id');
                    $data['total_employees'] = $deptUserIds->count();
                    $data['active_employees'] = User::where('department_id', $deptId)->where('status', 'active')->count();
                    
                    $attendance = DB::table('attendance_days')
                        ->whereIn('user_id', $deptUserIds)
                        ->where('date', $today)
                        ->selectRaw('
                            SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present,
                            SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent,
                            SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) as late,
                            SUM(CASE WHEN status = "leave" THEN 1 ELSE 0 END) as on_leave
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
                
                $data['pending_submissions'] = 0;
            }

            if ($activeRole === 'super_admin' || $activeRole === 'hr') {
                $data['active_projects'] = $hasProjects
                    ? Cache::remember("dashboard_active_projects_count", 300, fn() => DB::table('projects')->where('status', 'active')->count()) : 0;
                $data['pending_tasks'] = $hasTasks
                    ? Cache::remember("dashboard_pending_tasks_count", 300, fn() => DB::table('tasks')->whereIn('status', ['todo', 'in_progress', 'review'])->count()) : 0;
            } elseif ($activeRole === 'employee') {
                $data['active_projects'] = ($hasProjects && $hasProjectMembers)
                    ? DB::table('project_members')
                        ->join('projects', 'project_members.project_id', '=', 'projects.id')
                        ->where('project_members.user_id', $user->id)
                        ->where('projects.status', 'active')
                        ->count() : 0;
                $data['pending_tasks'] = $hasTasks
                    ? DB::table('tasks')->where('assignee_id', $user->id)->whereIn('status', ['todo', 'in_progress', 'review'])->count() : 0;
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
