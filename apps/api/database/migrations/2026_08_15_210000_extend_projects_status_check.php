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

        // Drop the old projects status CHECK and add an extended one that includes 'review' and 'pending_review'
        DB::statement("ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check");
        DB::statement("ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (status::text = ANY (ARRAY['active','completed','archived','review','pending_review']::text[]))");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check");
        DB::statement("ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (status::text = ANY (ARRAY['active','completed','archived']::text[]))");
    }
};
