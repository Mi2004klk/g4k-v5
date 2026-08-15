<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE INDEX IF NOT EXISTS idx_att_events_user_time ON attendance_events (user_id, timestamp)');

        DB::statement('CREATE INDEX IF NOT EXISTS idx_att_days_user_date ON attendance_days (user_id, date)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_att_days_date ON attendance_days (date)');

        if (Schema::hasTable('tasks')) {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks (assignee_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status)');
        }

        if (Schema::hasTable('leave_requests')) {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_leave_user_status ON leave_requests (user_id, status)');
        }
    }

    public function down(): void
    {
        Schema::table('attendance_events', function (Blueprint $table) {
            $table->dropIndex('idx_att_events_user_time');
        });

        Schema::table('attendance_days', function (Blueprint $table) {
            $table->dropIndex('idx_att_days_user_date');
            $table->dropIndex('idx_att_days_date');
        });

        if (Schema::hasTable('tasks')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->dropIndex('idx_tasks_assignee');
                $table->dropIndex('idx_tasks_status');
            });
        }

        if (Schema::hasTable('leave_requests')) {
            Schema::table('leave_requests', function (Blueprint $table) {
                $table->dropIndex('idx_leave_user_status');
            });
        }
    }
};
