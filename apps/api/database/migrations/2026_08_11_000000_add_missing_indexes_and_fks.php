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
        Schema::table('task_time_logs', function (Blueprint $table) {
            $table->index('log_date', 'idx_task_time_logs_log_date');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->index('conversation_id', 'idx_messages_conversation_id');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index('created_at', 'idx_notifications_created_at');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('subject_id', 'idx_audit_logs_subject_id');
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'work_schedule_id')) {
                $table->foreign('work_schedule_id')->references('id')->on('work_schedules')->nullOnDelete();
            }
            if (Schema::hasColumn('users', 'theme_mode')) {
                $table->dropColumn('theme_mode');
            }
            if (Schema::hasColumn('users', 'density')) {
                $table->dropColumn('density');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['work_schedule_id']);
            $table->string('theme_mode')->default('system');
            $table->string('density')->default('comfortable');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_logs_subject_id');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_created_at');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('idx_messages_conversation_id');
        });

        Schema::table('task_time_logs', function (Blueprint $table) {
            $table->dropIndex('idx_task_time_logs_log_date');
        });
    }
};
