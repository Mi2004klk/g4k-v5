<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Only run on Postgres — SQLite has no CHECK constraints to alter
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // Drop old CHECK constraints and add extended ones
        DB::statement("ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_status_check");
        DB::statement("ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_status_check CHECK (status::text = ANY (ARRAY['pending','approved','rejected','cancelled']::text[]))");

        DB::statement("ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_status_check");
        DB::statement("ALTER TABLE approvals ADD CONSTRAINT approvals_status_check CHECK (status::text = ANY (ARRAY['submitted','pending','approved','rejected','resolved']::text[]))");

        DB::statement("ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_decision_check");
        DB::statement("ALTER TABLE approvals ADD CONSTRAINT approvals_decision_check CHECK (decision::text = ANY (ARRAY['approved','rejected','cancelled']::text[]))");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_status_check");
        DB::statement("ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_status_check CHECK (status::text = ANY (ARRAY['pending','approved','rejected']::text[]))");

        DB::statement("ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_status_check");
        DB::statement("ALTER TABLE approvals ADD CONSTRAINT approvals_status_check CHECK (status::text = ANY (ARRAY['submitted','pending','approved','rejected']::text[]))");

        DB::statement("ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_decision_check");
        DB::statement("ALTER TABLE approvals ADD CONSTRAINT approvals_decision_check CHECK (decision::text = ANY (ARRAY['approved','rejected']::text[]))");
    }
};
