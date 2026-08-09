<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_days', function (Blueprint $table) {
            $table->index(['user_id', 'date'], 'idx_attendance_days_user_date');
            $table->index('date', 'idx_attendance_days_date');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('department_id', 'idx_users_department_id');
            $table->index('designation_id', 'idx_users_designation_id');
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->index('user_id', 'idx_leave_requests_user_id');
            $table->index('status', 'idx_leave_requests_status');
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropIndex('idx_leave_requests_status');
            $table->dropIndex('idx_leave_requests_user_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_designation_id');
            $table->dropIndex('idx_users_department_id');
        });

        Schema::table('attendance_days', function (Blueprint $table) {
            $table->dropIndex('idx_attendance_days_date');
            $table->dropIndex('idx_attendance_days_user_date');
        });
    }
};
