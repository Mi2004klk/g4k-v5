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
        Schema::table('leave_requests', function (Blueprint $table) {
            // Task 230: Partial unique index to prevent pending overlaps
            // SQLite doesn't natively support this through Blueprint partialIndex easily without raw SQL,
            // but Laravel 11 handles it for supported DBs if we use raw statements, or we can just use 
            // a unique constraint. Actually, the task says "Verify partial-unique index...WHERE status=pending".
            // Since games4kings uses PostgreSQL in production, we can use raw SQL for the partial index.
        });

        // Use raw SQL for partial index to support PostgreSQL
        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_leave_overlap ON leave_requests (user_id, start_date, end_date) WHERE status = \'pending\'');

        Schema::table('leave_requests', function (Blueprint $table) {
            // Task 235: Performance indexes
            $table->index(['user_id', 'status'], 'idx_leave_requests_user_status');
            $table->index(['start_date', 'end_date'], 'idx_leave_requests_dates');
        });

        Schema::table('approvals', function (Blueprint $table) {
            $table->index(['approvable_type', 'approvable_id'], 'idx_approvals_polymorphic');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS unique_pending_leave_overlap');

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropIndex('idx_leave_requests_user_status');
            $table->dropIndex('idx_leave_requests_dates');
        });

        Schema::table('approvals', function (Blueprint $table) {
            $table->dropIndex('idx_approvals_polymorphic');
        });
    }
};
