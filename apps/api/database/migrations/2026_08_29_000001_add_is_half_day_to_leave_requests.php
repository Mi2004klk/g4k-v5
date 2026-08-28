<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->boolean('is_half_day')->default(false)->after('end_date');
        });

        Schema::table('leave_balances', function (Blueprint $table) {
            $table->decimal('allowed', 8, 2)->default(12)->change();
            $table->decimal('used', 8, 2)->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('leave_balances', function (Blueprint $table) {
            $table->integer('allowed')->default(12)->change();
            $table->integer('used')->default(0)->change();
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn('is_half_day');
        });
    }
};
