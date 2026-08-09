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

        // Sync existing statuses
        DB::statement("
            UPDATE leave_requests lr
            SET status = a.status
            FROM approvals a
            WHERE lr.approval_id = a.id
        ");

        // Partial unique index to prevent overlapping pending requests
        DB::statement("
            CREATE UNIQUE INDEX leave_requests_no_overlap 
            ON leave_requests (user_id, start_date, end_date) 
            WHERE status = 'pending'
        ");
    }

    public function down(): void
    {
        DB::statement("DROP INDEX IF EXISTS leave_requests_no_overlap");
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
