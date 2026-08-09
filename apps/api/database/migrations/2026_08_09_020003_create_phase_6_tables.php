<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->morphs('approvable');
            $table->enum('status', ['submitted', 'pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('submitted_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('submitted_at')->useCurrent();
            $table->enum('current_approver_role', ['super_admin', 'hr'])->nullable();
            $table->enum('decision', ['approved', 'rejected'])->nullable();
            $table->text('decision_reason')->nullable();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->jsonb('payload')->nullable();
            $table->timestamps();

            $table->unique(['approvable_type', 'approvable_id']);
            $table->index(['status', 'current_approver_role']);
            $table->index('submitted_by');
        });

        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason');
            $table->enum('type', ['casual', 'sick', 'earned', 'unpaid']);
            $table->foreignId('approval_id')->nullable()->constrained('approvals')->nullOnDelete();
            $table->timestamps();

            $table->index(['user_id', 'start_date']);
        });

        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->date('date')->unique();
            $table->boolean('recurring')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('date');
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->string('link')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('holidays');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('approvals');
    }
};
