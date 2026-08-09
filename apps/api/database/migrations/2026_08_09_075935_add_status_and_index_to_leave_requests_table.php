<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
        });

        // Sync existing statuses using a subquery (portable across SQLite & Postgres;
        // the previous `UPDATE ... FROM ... alias` syntax is Postgres-only and broke tests).
        DB::table('leave_requests')
            ->whereNotNull('approval_id')
            ->update([
                'status' => DB::raw('(SELECT status FROM approvals WHERE approvals.id = leave_requests.approval_id)'),
            ]);

        // Partial unique index to prevent overlapping pending requests.
        // Postgres supports WHERE on indexes; SQLite (tests) does too (>=3.8). Guard just in case.
        $driver = DB::getDriverName();
        if ($driver === 'pgsql' || $driver === 'sqlite') {
            DB::statement("
                CREATE UNIQUE INDEX IF NOT EXISTS leave_requests_no_overlap
                ON leave_requests (user_id, start_date, end_date)
                WHERE status = 'pending'
            ");
        }
    }

    public function down(): void
    {
        DB::statement("DROP INDEX IF EXISTS leave_requests_no_overlap");
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
