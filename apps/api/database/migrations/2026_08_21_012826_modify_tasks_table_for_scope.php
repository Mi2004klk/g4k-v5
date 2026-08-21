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
        // For Postgres, if it was an enum, Laravel creates a check constraint.
        try {
            DB::statement('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_scope_check');
        } catch (\Exception $e) {}

        Schema::table('tasks', function (Blueprint $table) {
            $table->string('scope')->default('global')->change();
            $table->unsignedBigInteger('scope_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('scope_id');
        });
    }
};
