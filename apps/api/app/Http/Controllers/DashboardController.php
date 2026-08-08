<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Department;

class DashboardController extends Controller
{
    public function metrics(Request $request)
    {
        // Identify active role from token to shape the response
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

        $metrics = [];

        // In Phase 4, we only have basic Org data for metrics.
        // Attendance/Projects/Tasks will be stubbed or added in future phases.

        if (in_array($activeRole, ['super_admin', 'hr'])) {
            $metrics['total_employees'] = User::count();
            $metrics['active_employees'] = User::where('status', 'active')->count();
            $metrics['departments'] = Department::count();
        }

        // Add stubbed metrics for the frontend to render correctly
        $metrics['present_today'] = 0; // Stub Phase 5
        $metrics['absent_today'] = 0;  // Stub Phase 5
        $metrics['late_today'] = 0;    // Stub Phase 5
        $metrics['active_projects'] = \Illuminate\Support\Facades\DB::table('projects')->where('status', 'active')->count();
        $metrics['pending_tasks'] = \Illuminate\Support\Facades\DB::table('tasks')->where('assignee_id', $user->id)->whereIn('status', ['todo', 'in_progress', 'review'])->count();

        return response()->json([
            'metrics' => $metrics,
            'role' => $activeRole
        ]);
    }
}
