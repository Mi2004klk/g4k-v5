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
        $tables = [
            'auto_numberings', 'companies', 'users', 'projects', 'report_definitions',
            'settings', 'holidays', 'qa_forms', 'departments', 'announcements', 
            'designations', 'teams', 'conversations', 'capabilities', 'role_capabilities'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'demo_tag')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->uuid('demo_tag')->nullable()->index();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe down
    }
};
