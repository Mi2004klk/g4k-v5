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

            if (in_array($activeRole, ['super_admin', 'hr'])) {
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
            }

            // Safe table check for projects & tasks
            $data['has_projects_module'] = Schema::hasTable('projects');
            $data['active_projects'] = $data['has_projects_module']
                ? DB::table('projects')->where('status', 'active')->count()
                : 0;

            $data['has_tasks_module'] = Schema::hasTable('tasks');
            $data['pending_tasks'] = $data['has_tasks_module']
                ? DB::table('tasks')
                    ->where('assignee_id', $user->id)
                    ->whereIn('status', ['todo', 'in_progress', 'review'])
                    ->count()
                : 0;
                
            if ($activeRole === 'employee') {
                $todayStatus = DB::table('attendance_days')
                    ->where('user_id', $user->id)
                    ->where('date', $today)
                    ->value('status');
                $data['my_today_status'] = $todayStatus ?? 'absent';
            }

            return $data;
        });

        return response()->json([
            'metrics' => $metrics,
            'role' => $activeRole
        ]);
    }
}
