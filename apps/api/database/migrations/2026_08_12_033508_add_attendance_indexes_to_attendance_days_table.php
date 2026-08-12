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
            $table->index(['user_id', 'date']);
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_days', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'date']);
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'status']);
        });
    }
};
