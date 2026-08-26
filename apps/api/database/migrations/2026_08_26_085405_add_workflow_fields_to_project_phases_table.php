<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_phases', function (Blueprint $table) {
            $table->foreignId('assignee_id')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->foreignId('qa_form_id')->nullable()->after('assignee_id')->constrained('qa_forms')->nullOnDelete();
            $table->json('workflow_settings')->nullable()->after('qa_form_id');
        });
    }

    public function down(): void
    {
        Schema::table('project_phases', function (Blueprint $table) {
            $table->dropForeign(['assignee_id']);
            $table->dropForeign(['qa_form_id']);
            $table->dropColumn(['assignee_id', 'qa_form_id', 'workflow_settings']);
        });
    }
};
