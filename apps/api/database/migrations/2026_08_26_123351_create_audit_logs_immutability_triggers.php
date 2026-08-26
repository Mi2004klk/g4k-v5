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
                    RAISE EXCEPTION 'Audit logs are immutable';
                END;
                $$ LANGUAGE plpgsql;

                CREATE TRIGGER prevent_audit_log_update
                BEFORE UPDATE ON audit_logs
                FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

                CREATE TRIGGER prevent_audit_log_delete
                BEFORE DELETE ON audit_logs
                FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
            ");
        } elseif ($driver === 'sqlite') {
            DB::unprepared("
                CREATE TRIGGER prevent_audit_log_update 
                BEFORE UPDATE ON audit_logs 
                BEGIN 
                    SELECT RAISE(ABORT, 'Audit logs are immutable'); 
                END;
            ");
            DB::unprepared("
                CREATE TRIGGER prevent_audit_log_delete 
                BEFORE DELETE ON audit_logs 
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
                DROP TRIGGER IF EXISTS prevent_audit_log_update ON audit_logs;
                DROP TRIGGER IF EXISTS prevent_audit_log_delete ON audit_logs;
                DROP FUNCTION IF EXISTS prevent_audit_log_modification();
            ");
        } elseif ($driver === 'sqlite') {
            DB::unprepared("DROP TRIGGER IF EXISTS prevent_audit_log_update;");
            DB::unprepared("DROP TRIGGER IF EXISTS prevent_audit_log_delete;");
        }
    }
};
