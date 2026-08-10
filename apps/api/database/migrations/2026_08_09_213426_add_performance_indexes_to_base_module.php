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
        // Use raw statements for IF NOT EXISTS to prevent duplicates
        DB::statement('CREATE INDEX IF NOT EXISTS users_department_id_index ON users (department_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS users_status_index ON users (status)');
        
        DB::statement('CREATE INDEX IF NOT EXISTS leave_requests_user_id_index ON leave_requests (user_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS leave_requests_status_index ON leave_requests (status)');
        
        DB::statement('CREATE INDEX IF NOT EXISTS attendance_days_user_id_index ON attendance_days (user_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS attendance_days_date_index ON attendance_days (date)');
        DB::statement('CREATE INDEX IF NOT EXISTS attendance_days_status_index ON attendance_days (status)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS attendance_days_status_index');
        DB::statement('DROP INDEX IF EXISTS attendance_days_date_index');
        DB::statement('DROP INDEX IF EXISTS attendance_days_user_id_index');
        
        DB::statement('DROP INDEX IF EXISTS leave_requests_status_index');
        DB::statement('DROP INDEX IF EXISTS leave_requests_user_id_index');
        
        DB::statement('DROP INDEX IF EXISTS users_status_index');
        DB::statement('DROP INDEX IF EXISTS users_department_id_index');
    }
};
