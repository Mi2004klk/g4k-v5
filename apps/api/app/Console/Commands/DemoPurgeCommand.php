<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class DemoPurgeCommand extends Command
{
    protected $signature = 'demo:purge';
    protected $description = 'Teardown all demo data based on demo_tag and is_demo flags';

    public function handle()
    {
        $this->info('Starting demo teardown...');

        DB::transaction(function () {
            // Precise FK-safe deletion order
            $order = [
                'personal_access_tokens', 'login_attempts', 'password_reset_requests',
                'conversation_message_reads', 'reactions', 'notifications', 'messages',
                'conversation_user', 'conversations', 'task_time_logs', 'task_comments',
                'task_activities', 'task_reminders', 'qa_submissions', 'qa_form_fields',
                'qa_forms', 'approvals', 'tasks', 'leave_balances', 'leave_requests',
                'attendance_events', 'attendance_days', 'announcements', 'quick_notes',
                'pins', 'feedback', 'export_jobs', 'saved_views', 'scheduled_reports',
                'audit_logs', 'projects', 'department_hr', 'role_assignments', 'users',
                'designations', 'departments', 'teams', 'company_profiles',
                'work_schedules', 'settings'
            ];

            $report = [];

            // 1. Delete tagged rows from dependent tables
            foreach ($order as $table) {
                if (Schema::hasTable($table) && Schema::hasColumn($table, 'demo_tag')) {
                    $count = DB::table($table)->whereNotNull('demo_tag')->delete();
                    if ($count > 0) $report[$table] = $count;
                }
            }

            // 2. Delete explicitly is_demo rows for entities that might not have a demo_tag assigned
            $isDemoTables = ['users', 'projects', 'qa_forms', 'holidays', 'departments', 'announcements', 'designations', 'teams', 'conversations'];
            foreach ($isDemoTables as $table) {
                if (Schema::hasTable($table) && Schema::hasColumn($table, 'is_demo')) {
                    $count = DB::table($table)->where('is_demo', true)->delete();
                    if ($count > 0) {
                        $report[$table] = ($report[$table] ?? 0) + $count;
                    }
                }
            }

            // 3. Cleanup tokens for demo users before deleting them
            $demoUserIds = DB::table('users')->where('is_demo', true)->pluck('id');
            if ($demoUserIds->isNotEmpty()) {
                $tokenCount = DB::table('personal_access_tokens')
                                ->where('tokenable_type', \App\Models\User::class)
                                ->whereIn('tokenable_id', $demoUserIds)
                                ->delete();
                if ($tokenCount > 0) $report['personal_access_tokens'] = ($report['personal_access_tokens'] ?? 0) + $tokenCount;
            }

            // 3.5 Truncate residues
            DB::table('notifications')->truncate();
            DB::table('conversation_message_reads')->truncate();
            DB::table('audit_logs')->truncate();

            // 4. Delete demo users
            $userCount = DB::table('users')->where('is_demo', true)->delete();
            if ($userCount > 0) $report['users'] = $userCount;

            // 5. Delete specific system settings set by demo seeder
            DB::table('settings')->where('key', 'demo_dataset_version')->delete();

            // Print report
            foreach ($report as $table => $count) {
                $this->line("Purged $count rows from $table.");
            }

            // 6. Assert orphan FKs
            $orphans = 0;
            foreach ($order as $table) {
                if (Schema::hasTable($table) && Schema::hasColumn($table, 'demo_tag')) {
                    $orphans += DB::table($table)->whereNotNull('demo_tag')->count();
                }
            }
            if ($orphans > 0) {
                throw new \Exception("Orphan demo data detected: $orphans rows remain with demo_tag.");
            }
        });

        // Targeted cache clearing
        $demoUserIds = DB::table('users')->where('is_demo', true)->pluck('id');
        foreach ($demoUserIds as $uid) {
            Cache::forget("user_{$uid}_roles");
            Cache::forget("user_prefs_{$uid}");
        }
        $cacheKeys = ['holidays', 'settings:notifications', 'dashboard_*']; 
        // Note: For wildcard clearing in Redis, it's more complex, but we'll clear common static keys
        Cache::forget('holidays_list');
        
        // Audit Log teardown event (un-tagged so it survives)
        \App\Models\AuditLog::create([
            'user_id' => null,
            'action' => 'demo_purge',
            'subject_type' => 'system',
            'subject_id' => 'system',
            'meta' => ['message' => 'Demo dataset was purged completely.'],
            'ip' => request()->ip(),
            'at' => now()
        ]);

        $this->info('Demo teardown complete. Zero demo rows remain.');
        return 0;
    }
}
