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
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->nullable()->after('email');
            $table->foreignId('company_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('alternate_mobile')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->date('joining_date')->nullable();
            $table->string('blood_group')->nullable();
            $table->string('working_hours')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn([
                'username',
                'company_id',
                'alternate_mobile',
                'emergency_contact',
                'joining_date',
                'blood_group',
                'working_hours'
            ]);
        });
    }
};
