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
        DB::statement('ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_no_self_approval');
        DB::statement('ALTER TABLE approvals ADD CONSTRAINT approvals_no_self_approval CHECK (decided_by IS NULL OR decided_by != submitted_by)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_no_self_approval');
    }
};
