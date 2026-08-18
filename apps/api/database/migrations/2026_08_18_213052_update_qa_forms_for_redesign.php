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
        Schema::table('qa_forms', function (Blueprint $table) {
            $table->boolean('is_template')->default(true);
        });

        Schema::table('qa_form_fields', function (Blueprint $table) {
            // Drop enum and re-add as string to allow more types
            $table->dropColumn('field_type');
            $table->string('section_id')->nullable();
            $table->jsonb('branching_logic')->nullable();
        });

        Schema::table('qa_form_fields', function (Blueprint $table) {
            $table->string('field_type')->default('input');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('qa_form_fields', function (Blueprint $table) {
            $table->dropColumn('field_type');
            $table->dropColumn('section_id');
            $table->dropColumn('branching_logic');
        });

        Schema::table('qa_form_fields', function (Blueprint $table) {
            $table->enum('field_type', ['input', 'textarea', 'checkbox', 'slider', 'select'])->default('input');
        });

        Schema::table('qa_forms', function (Blueprint $table) {
            $table->dropColumn('is_template');
        });
    }
};
