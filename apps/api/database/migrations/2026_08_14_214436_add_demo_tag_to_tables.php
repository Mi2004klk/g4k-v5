<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'departments', 'projects', 'qa_forms', 'conversations', 'announcements', 'holidays',
            'attendance_days', 'attendance_events', 'leave_requests', 'approvals', 'tasks',
            'messages', 'notifications', 'quick_notes', 'pins', 'audit_logs'
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (!Schema::hasColumn($tableName, 'demo_tag')) {
                        $table->uuid('demo_tag')->nullable()->index();
                    }
                });
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'departments', 'projects', 'qa_forms', 'conversations', 'announcements', 'holidays',
            'attendance_days', 'attendance_events', 'leave_requests', 'approvals', 'tasks',
            'messages', 'notifications', 'quick_notes', 'pins', 'audit_logs'
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (Schema::hasColumn($tableName, 'demo_tag')) {
                        $table->dropColumn('demo_tag');
                    }
                });
            }
        }
    }
};
