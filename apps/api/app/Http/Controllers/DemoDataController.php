<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use App\Models\Setting;

class DemoDataController extends Controller
{
    public function getStatus(Request $request)
    {
        $version = Setting::where('key', 'demo_dataset_version')->value('value');
        $counts = [];
        
        $isDemoTables = ['users', 'projects', 'qa_forms', 'holidays', 'departments', 'announcements', 'designations', 'teams', 'conversations'];
        foreach ($isDemoTables as $table) {
            if (\Illuminate\Support\Facades\Schema::hasTable($table) && \Illuminate\Support\Facades\Schema::hasColumn($table, 'is_demo')) {
                $counts[$table] = DB::table($table)->where('is_demo', true)->count();
            }
        }

        $order = [
            'personal_access_tokens', 'login_attempts', 'password_reset_requests',
            'conversation_message_reads', 'reactions', 'notifications', 'messages',
            'conversation_user', 'task_time_logs', 'task_comments',
            'task_activities', 'task_reminders', 'qa_submissions', 'qa_form_fields',
            'approvals', 'tasks', 'leave_balances', 'leave_requests',
            'attendance_events', 'attendance_days', 'quick_notes',
            'pins', 'feedback', 'export_jobs', 'saved_views', 'scheduled_reports',
            'audit_logs', 'department_hr', 'role_assignments',
            'company_profiles', 'work_schedules', 'settings'
        ];

        foreach ($order as $table) {
            if (\Illuminate\Support\Facades\Schema::hasTable($table) && \Illuminate\Support\Facades\Schema::hasColumn($table, 'demo_tag')) {
                $count = DB::table($table)->whereNotNull('demo_tag')->count();
                if ($count > 0) {
                    $counts[$table] = ($counts[$table] ?? 0) + $count;
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'version' => $version,
                'counts' => $counts
            ]
        ]);
    }

    public function purge(Request $request)
    {
        $request->validate([
            'confirmation' => 'required|string|in:REMOVE DEMO DATA'
        ]);

        Artisan::call('demo:purge');
        
        \App\Services\NotificationService::sendGlobalNotification(
            $request->user(), 
            "Demo dataset has been successfully removed.",
            "/dashboard/settings"
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Demo purge executed successfully.'
        ]);
    }

    public function seed(Request $request)
    {
        Artisan::queue('demo:seed', ['--fresh' => true]);
        return response()->json([
            'status' => 'success',
            'message' => 'Demo seed queued successfully. It may take a few minutes to complete.',
            'version' => 'v2.0.0'
        ]);
    }
}
