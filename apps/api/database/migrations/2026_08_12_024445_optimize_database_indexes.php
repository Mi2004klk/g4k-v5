<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 2.5 Missing composite database indexes
        Schema::table('task_time_logs', function (Blueprint $table) {
            $table->index(['user_id', 'log_date']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'created_at']);
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['user_id', 'at']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->index(['conversation_id', 'created_at']);
        });

        Schema::table('conversation_user', function (Blueprint $table) {
            $table->index('user_id');
        });

        // 2.6 Redundant/duplicate database indexes
        // We use raw SQL to drop specific named indexes to avoid errors if the name doesn't match Laravel's default pattern
        $indexesToDrop = [
            'task_time_logs_log_date_index',
            'idx_attendance_days_user_date',
            'attendance_days_user_id_index',
            'attendance_days_date_index',
            'attendance_days_status_index',
            'users_department_id_index',
            'leave_requests_user_id_index',
            'leave_requests_status_index',
            'attendance_events_client_id_index',
            'holidays_date_index'
        ];

        foreach ($indexesToDrop as $indexName) {
            DB::statement("DROP INDEX IF EXISTS {$indexName}");
        }

        // drop one of the two identical partial unique indexes on leave_requests.
        // Usually named leave_requests_user_id_start_date_end_date_unique or similar.
        DB::statement("DROP INDEX IF EXISTS idx_unique_approved_leave");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 
    }
};
