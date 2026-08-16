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
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        // Get all tables in the public schema
        $tables = DB::select("
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        ");

        foreach ($tables as $table) {
            $tableName = $table->tablename;
            
            // Enable RLS
            DB::statement("ALTER TABLE \"{$tableName}\" ENABLE ROW LEVEL SECURITY;");
            
            // Note: Since no explicit policies are added, Supabase's default behavior 
            // when RLS is enabled is to deny all access. This is exactly what we want 
            // to block /rest/v1/ anonymous access while our Laravel backend connecting 
            // as 'postgres' superuser naturally bypasses RLS.
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $tables = DB::select("
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        ");

        foreach ($tables as $table) {
            $tableName = $table->tablename;
            DB::statement("ALTER TABLE \"{$tableName}\" DISABLE ROW LEVEL SECURITY;");
        }
    }
};
