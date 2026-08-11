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
        // Add missing composite indexes
        Schema::table('task_time_logs', function (Blueprint $table) {
            $table->index(['user_id', 'log_date'], 'idx_task_time_logs_user_date');
        });
        DB::statement('DROP INDEX IF EXISTS idx_task_time_logs_log_date'); // Drop redundant index

        // notifications: composite (user_id, created_at DESC)
        DB::statement('CREATE INDEX idx_notifications_user_created_desc ON notifications (user_id, created_at DESC)');
        
        // audit_logs: composite (user_id, at DESC)
        DB::statement('CREATE INDEX idx_audit_logs_user_at_desc ON audit_logs (user_id, at DESC)');

        // messages: composite (conversation_id, created_at)
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['conversation_id', 'created_at'], 'idx_messages_conv_created');
        });

        // conversation_user: index on user_id (leading column)
        Schema::table('conversation_user', function (Blueprint $table) {
            $table->index('user_id', 'idx_conversation_user_user_id');
        });

        // Drop redundant/duplicate indexes
        // attendance_days
        DB::statement('DROP INDEX IF EXISTS idx_attendance_days_user_date');
        DB::statement('DROP INDEX IF EXISTS attendance_days_user_id_index');
        DB::statement('DROP INDEX IF EXISTS attendance_days_date_index');
        DB::statement('DROP INDEX IF EXISTS attendance_days_status_index');

        // users
        DB::statement('DROP INDEX IF EXISTS users_department_id_index');

        // leave_requests
        DB::statement('DROP INDEX IF EXISTS idx_leave_requests_user_id');
        DB::statement('DROP INDEX IF EXISTS leave_requests_user_id_index');
        DB::statement('DROP INDEX IF EXISTS leave_requests_status_index');
        DB::statement('DROP INDEX IF EXISTS unique_pending_leave_overlap');

        // attendance_events
        DB::statement('DROP INDEX IF EXISTS attendance_events_client_id_index');

        // holidays
        DB::statement('DROP INDEX IF EXISTS holidays_date_index');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove missing composite indexes
        DB::statement('DROP INDEX IF EXISTS idx_task_time_logs_user_date');
        DB::statement('DROP INDEX IF EXISTS idx_notifications_user_created_desc');
        DB::statement('DROP INDEX IF EXISTS idx_audit_logs_user_at_desc');
        DB::statement('DROP INDEX IF EXISTS idx_messages_conv_created');
        DB::statement('DROP INDEX IF EXISTS idx_conversation_user_user_id');
    }
};
