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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'completed', 'archived'])->default('active');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->date('deadline')->nullable();
            $table->foreignId('team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->integer('progress')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'deadline']);
            $table->index(['team_id', 'status']);
        });

        Schema::create('project_members', function (Blueprint $table) {
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('member'); // manager, member
            $table->primary(['project_id', 'user_id']);
            $table->timestamps();
        });

        Schema::create('qa_forms', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('qa_form_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('qa_form_id')->constrained('qa_forms')->cascadeOnDelete();
            $table->string('label');
            $table->enum('field_type', ['input', 'textarea', 'checkbox', 'slider', 'select']);
            $table->boolean('required')->default(false);
            $table->jsonb('options')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained('projects')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['todo', 'in_progress', 'review', 'done'])->default('todo');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('scope', ['global', 'department', 'role'])->default('global');
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reporter_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('due_date')->nullable();
            $table->integer('progress')->default(0);
            $table->foreignId('parent_id')->nullable()->constrained('tasks')->nullOnDelete();
            $table->foreignId('blocked_by')->nullable()->constrained('tasks')->nullOnDelete();
            $table->foreignId('qa_form_id')->nullable()->constrained('qa_forms')->nullOnDelete();
            $table->jsonb('recurrence')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->text('submission_note')->nullable();
            $table->timestamps();

            $table->index(['assignee_id', 'status']);
            $table->index(['project_id', 'status']);
            $table->index(['due_date', 'status']);
        });

        Schema::create('qa_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('qa_form_id')->constrained('qa_forms')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->jsonb('values');
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('task_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('task_activity', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('event', ['created', 'assigned', 'progress', 'submitted', 'approved', 'redo']);
            $table->jsonb('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['task_id', 'created_at']);
        });

        Schema::create('task_time_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->nullable()->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('minutes_logged')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->text('description')->nullable();
            $table->date('log_date')->useCurrent();
            $table->timestamps();
        });

        if (!Schema::hasTable('saved_views')) {
            Schema::create('saved_views', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('entity');
                $table->string('name');
                $table->jsonb('config');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_time_logs');
        Schema::dropIfExists('task_activity');
        Schema::dropIfExists('task_comments');
        Schema::dropIfExists('qa_submissions');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('qa_form_fields');
        Schema::dropIfExists('qa_forms');
        Schema::dropIfExists('project_members');
        Schema::dropIfExists('projects');
    }
};
