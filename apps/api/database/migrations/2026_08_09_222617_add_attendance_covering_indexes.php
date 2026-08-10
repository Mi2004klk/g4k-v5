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
        Schema::table('attendance_days', function (Blueprint $table) {
            $table->index(['user_id', 'date', 'status'], 'idx_attendance_days_covering');
        });

        Schema::table('attendance_events', function (Blueprint $table) {
            $table->index(['user_id', 'timestamp', 'type'], 'idx_attendance_events_covering');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_events', function (Blueprint $table) {
            $table->dropIndex('idx_attendance_events_covering');
        });

        Schema::table('attendance_days', function (Blueprint $table) {
            $table->dropIndex('idx_attendance_days_covering');
        });
    }
};
