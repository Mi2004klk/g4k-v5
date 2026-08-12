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
        // Add feedback column
        Schema::table('approvals', function (Blueprint $table) {
            $table->text('feedback')->nullable();
        });

        // Postgres enum check constraint is named table_column_check
        DB::statement("ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_decision_check");
        DB::statement("ALTER TABLE approvals ADD CONSTRAINT approvals_decision_check CHECK (decision::text = ANY (ARRAY['approved'::character varying, 'rejected'::character varying, 'redo'::character varying]::text[]))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_decision_check");
        DB::statement("ALTER TABLE approvals ADD CONSTRAINT approvals_decision_check CHECK (decision::text = ANY (ARRAY['approved'::character varying, 'rejected'::character varying]::text[]))");
        
        Schema::table('approvals', function (Blueprint $table) {
            $table->dropColumn('feedback');
        });
    }
};
