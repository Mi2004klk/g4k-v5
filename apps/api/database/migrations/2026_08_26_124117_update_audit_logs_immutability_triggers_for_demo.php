<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::unprepared("
                CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
                RETURNS trigger AS $$
                BEGIN
                    IF TG_OP = 'DELETE' THEN
                        IF OLD.demo_tag IS NOT NULL THEN
                            RETURN OLD;
                        END IF;
                    END IF;
                    RAISE EXCEPTION 'Audit logs are immutable';
                END;
                $$ LANGUAGE plpgsql;
            ");
        } elseif ($driver === 'sqlite') {
            DB::unprepared("DROP TRIGGER IF EXISTS prevent_audit_log_delete;");
            DB::unprepared("
                CREATE TRIGGER prevent_audit_log_delete 
                BEFORE DELETE ON audit_logs 
                WHEN OLD.demo_tag IS NULL
                BEGIN 
                    SELECT RAISE(ABORT, 'Audit logs are immutable'); 
                END;
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::unprepared("
                CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
                RETURNS trigger AS $$
                BEGIN
                    RAISE EXCEPTION 'Audit logs are immutable';
                END;
                $$ LANGUAGE plpgsql;
            ");
        } elseif ($driver === 'sqlite') {
            DB::unprepared("DROP TRIGGER IF EXISTS prevent_audit_log_delete;");
            DB::unprepared("
                CREATE TRIGGER prevent_audit_log_delete 
                BEFORE DELETE ON audit_logs 
                BEGIN 
                    SELECT RAISE(ABORT, 'Audit logs are immutable'); 
                END;
            ");
        }
    }
};
