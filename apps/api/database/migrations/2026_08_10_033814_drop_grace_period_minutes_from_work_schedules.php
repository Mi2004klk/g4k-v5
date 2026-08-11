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
        if (Schema::hasColumn('work_schedules', 'grace_period_minutes')) {
            Schema::table('work_schedules', function (Blueprint $table) {
                $table->dropColumn('grace_period_minutes');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_schedules', function (Blueprint $table) {
            $table->integer('grace_period_minutes')->default(10);
        });
    }
};
