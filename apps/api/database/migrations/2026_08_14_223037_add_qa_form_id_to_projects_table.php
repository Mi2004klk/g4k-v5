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
        if (Schema::hasTable('projects') && !Schema::hasColumn('projects', 'qa_form_id')) {
            Schema::table('projects', function (Blueprint $table) {
                        if (!Schema::hasColumn('projects', 'qa_form_id')) {
                            $table->foreignId('qa_form_id')->nullable()->constrained('qa_forms')->nullOnDelete();
                        }
                    });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'qa_form_id')) {
                $table->dropForeign(['qa_form_id']);
                $table->dropColumn('qa_form_id');
            }
        });
    }
};
