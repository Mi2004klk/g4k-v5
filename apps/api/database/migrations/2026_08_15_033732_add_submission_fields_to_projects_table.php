<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * T-21.6: Projects need submission_note (completion report text) and completed_at
     * so the completion flow works: submit → status=review → HR approves → status=completed
     */
    public function up(): void
    {
        if (Schema::hasTable('projects')) {
            Schema::table('projects', function (Blueprint $table) {
                if (!Schema::hasColumn('projects', 'submission_note')) {
                    $table->text('submission_note')->nullable()->after('description');
                }
                if (!Schema::hasColumn('projects', 'completed_at')) {
                    $table->timestamp('completed_at')->nullable()->after('submission_note');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('projects')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropColumnIfExists('submission_note');
                $table->dropColumnIfExists('completed_at');
            });
        }
    }
};
