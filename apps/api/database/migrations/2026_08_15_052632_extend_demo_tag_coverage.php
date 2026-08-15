<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $demoTagTables = [
            'teams', 'designations', 'task_comments', 'task_activities', 'task_time_logs',
            'qa_submissions', 'qa_form_fields', 'reactions', 'export_jobs', 'login_attempts',
            'leave_balances', 'feedback', 'company_profiles', 'saved_views', 'conversation_user',
            'conversation_message_reads', 'department_hr', 'role_assignments', 'work_schedules'
        ];

        foreach ($demoTagTables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'demo_tag')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->uuid('demo_tag')->nullable()->index();
                });
            }
        }

        $isDemoTables = [
            'departments', 'conversations', 'announcements', 'holidays', 'qa_forms', 'designations', 'teams'
        ];

        foreach ($isDemoTables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'is_demo')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->boolean('is_demo')->default(false)->index();
                });
            }
        }
        
        // Also ensure settings table has demo_tag if we create settings in demo
        if (Schema::hasTable('settings') && !Schema::hasColumn('settings', 'demo_tag')) {
            Schema::table('settings', function (Blueprint $table) {
                $table->uuid('demo_tag')->nullable()->index();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $demoTagTables = [
            'teams', 'designations', 'task_comments', 'task_activities', 'task_time_logs',
            'qa_submissions', 'qa_form_fields', 'reactions', 'export_jobs', 'login_attempts',
            'leave_balances', 'feedback', 'company_profiles', 'saved_views', 'conversation_user',
            'conversation_message_reads', 'department_hr', 'role_assignments', 'work_schedules',
            'settings'
        ];

        foreach ($demoTagTables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'demo_tag')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropColumn('demo_tag');
                });
            }
        }

        $isDemoTables = [
            'departments', 'conversations', 'announcements', 'holidays', 'qa_forms', 'designations', 'teams'
        ];

        foreach ($isDemoTables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'is_demo')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropColumn('is_demo');
                });
            }
        }
    }
};
