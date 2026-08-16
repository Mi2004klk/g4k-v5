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
        $tables = [
            'attendance_corrections', 'company_profile', 'dashboard_layouts',
            'password_reset_requests', 'project_members', 'pulse_aggregates',
            'pulse_entries', 'pulse_values', 'scheduled_reports', 'task_activity',
            'task_assignees', 'audit_log_entries', 'subscription', 'secrets'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'demo_tag')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->uuid('demo_tag')->nullable()->index();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'attendance_corrections', 'company_profile', 'dashboard_layouts',
            'password_reset_requests', 'project_members', 'pulse_aggregates',
            'pulse_entries', 'pulse_values', 'scheduled_reports', 'task_activity',
            'task_assignees', 'audit_log_entries', 'subscription', 'secrets'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'demo_tag')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropColumn('demo_tag');
                });
            }
        }
    }
};
