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
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE attendance_days DROP CONSTRAINT IF EXISTS attendance_days_status_check');
            DB::statement("ALTER TABLE attendance_days ADD CONSTRAINT attendance_days_status_check CHECK (status::text = ANY (ARRAY['present'::character varying, 'absent'::character varying, 'late'::character varying, 'on_leave'::character varying, 'holiday'::character varying, 'pending'::character varying]::text[]))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE attendance_days DROP CONSTRAINT IF EXISTS attendance_days_status_check');
            DB::statement("ALTER TABLE attendance_days ADD CONSTRAINT attendance_days_status_check CHECK (status::text = ANY (ARRAY['present'::character varying, 'absent'::character varying, 'late'::character varying, 'leave'::character varying]::text[]))");
        }
    }
};
