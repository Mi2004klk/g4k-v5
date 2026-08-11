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
        // DB-4: Missing Foreign Key
        Schema::table('attendance_events', function (Blueprint $table) {
            $table->foreign('project_id')->references('id')->on('projects')->nullOnDelete();
        });

        // Postgres-specific raw queries
        if (DB::connection()->getDriverName() === 'pgsql') {
            // DB-5: Redundant/duplicate indexes
            DB::statement('DROP INDEX IF EXISTS users_department_id_index');
            DB::statement('DROP INDEX IF EXISTS users_status_index');
            DB::statement('DROP INDEX IF EXISTS leave_requests_user_id_index');
            DB::statement('DROP INDEX IF EXISTS leave_requests_status_index');
            DB::statement('DROP INDEX IF EXISTS attendance_days_user_id_index');
            DB::statement('DROP INDEX IF EXISTS attendance_days_date_index');
            DB::statement('DROP INDEX IF EXISTS attendance_days_status_index');
            DB::statement('DROP INDEX IF EXISTS leave_requests_no_overlap');

            // DB-7: Export Jobs Status Check Constraint
            DB::statement("ALTER TABLE export_jobs ADD CONSTRAINT export_jobs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))");
            
            // DB-7: Scheduled Reports Status Check Constraint
            DB::statement("ALTER TABLE scheduled_reports ADD CONSTRAINT scheduled_reports_status_check CHECK (status IN ('active', 'paused'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_events', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
        });

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE export_jobs DROP CONSTRAINT IF EXISTS export_jobs_status_check');
            DB::statement('ALTER TABLE scheduled_reports DROP CONSTRAINT IF EXISTS scheduled_reports_status_check');
        }
    }
};
