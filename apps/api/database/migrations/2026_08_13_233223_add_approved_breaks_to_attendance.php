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
        Schema::table('attendance_events', function (Blueprint $table) {
            $table->boolean('is_approved')->default(false)->after('type');
        });

        Schema::table('attendance_days', function (Blueprint $table) {
            $table->integer('unapproved_break_seconds')->default(0)->after('break_seconds');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_days', function (Blueprint $table) {
            $table->dropColumn('unapproved_break_seconds');
        });

        Schema::table('attendance_events', function (Blueprint $table) {
            $table->dropColumn('is_approved');
        });
    }
};
