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

        $metrics = Cache::remember($cacheKey, 30, function () use ($user, $activeRole, $today) {
            $data = [];

            if ($activeRole === 'super_admin') {
                $data['total_employees'] = User::count();
                $data['active_employees'] = User::where('status', 'active')->count();
                $data['departments'] = Department::count();
                
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
                
                $data['pending_approvals'] = DB::table('leave_requests')->where('status', 'pending')->count();
                $data['recent_activity'] = DB::table('audit_logs')->orderBy('created_at', 'desc')->limit(10)->get();
            }

            if ($activeRole === 'hr') {
                $deptId = $user->department_id;
                
                // If HR has no dept, they get 0
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
                    
                    $data['pending_approvals'] = DB::table('leave_requests')->whereIn('user_id', $deptUserIds)->where('status', 'pending')->count();
                } else {
                    $data['total_employees'] = 0;
                    $data['active_employees'] = 0;
                    $data['present_today'] = 0;
                    $data['absent_today'] = 0;
                    $data['late_today'] = 0;
                    $data['leave_today'] = 0;
                    $data['pending_approvals'] = 0;
                }
                
                $data['pending_submissions'] = 0; // Empty state for submissions module
            }

            // Shared safe table checks for projects & tasks
            $data['has_projects_module'] = Schema::hasTable('projects');
            if ($activeRole === 'super_admin' || $activeRole === 'hr') {
                $data['active_projects'] = $data['has_projects_module']
                    ? DB::table('projects')->where('status', 'active')->count() : 0;
            } elseif ($activeRole === 'employee') {
                // Future module: just return 0 for now as 'my projects'
                $data['active_projects'] = 0;
            }

            $data['has_tasks_module'] = Schema::hasTable('tasks');
            if ($activeRole === 'super_admin' || $activeRole === 'hr') {
                $data['pending_tasks'] = $data['has_tasks_module']
                    ? DB::table('tasks')->whereIn('status', ['todo', 'in_progress', 'review'])->count() : 0;
            } elseif ($activeRole === 'employee') {
                $data['pending_tasks'] = $data['has_tasks_module']
                    ? DB::table('tasks')->where('assignee_id', $user->id)->whereIn('status', ['todo', 'in_progress', 'review'])->count() : 0;
            }
                
            if ($activeRole === 'employee') {
                $todayStatus = DB::table('attendance_days')
                    ->where('user_id', $user->id)
                    ->where('date', $today)
                    ->value('status');
                $data['my_today_status'] = $todayStatus ?? 'absent';
                
                // Future Modules (empty states)
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
