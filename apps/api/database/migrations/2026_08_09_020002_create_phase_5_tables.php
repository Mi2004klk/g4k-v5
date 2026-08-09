<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->time('start_time')->default('09:00:00');
            $table->time('end_time')->default('18:30:00');
            $table->integer('break_minutes')->default(45);
            $table->integer('standard_seconds')->default(31500); // 8h 45m
            $table->json('working_days')->nullable(); // [1,2,3,4,5,6] Mon-Sat
            $table->date('effective_from')->nullable();
            $table->boolean('is_default')->default(true);
            $table->timestamps();
        });

        Schema::create('attendance_events', function (Blueprint $table) {
            $table->id();
            $table->string('client_id')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('timestamp');
            $table->enum('type', ['clock_in', 'clock_out', 'break_start', 'break_end']);
            $table->unsignedBigInteger('project_id')->nullable();
            $table->json('device_meta')->nullable();
            $table->enum('source', ['local', 'server'])->default('server');
            $table->timestamps();

            $table->index(['user_id', 'timestamp']);
            $table->index('client_id');
        });

        Schema::create('attendance_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->timestamp('clock_in')->nullable();
            $table->timestamp('clock_out')->nullable();
            $table->timestamp('first_event')->nullable();
            $table->timestamp('last_event')->nullable();
            $table->integer('total_seconds')->default(0);
            $table->integer('break_seconds')->default(0);
            $table->integer('overtime_seconds')->default(0);
            $table->integer('late_minutes')->default(0);
            $table->enum('status', ['present', 'absent', 'late', 'leave'])->default('absent');
            $table->foreignId('corrected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('source', ['local', 'manual', 'server'])->default('server');
            $table->integer('version')->default(1);
            $table->timestamps();

            $table->unique(['user_id', 'date']);
            $table->index('date');
            $table->index(['status', 'date']);
        });

        Schema::create('attendance_corrections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_day_id')->constrained('attendance_days')->cascadeOnDelete();
            $table->foreignId('corrected_by')->constrained('users')->cascadeOnDelete();
            $table->string('field');
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->string('reason');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_corrections');
        Schema::dropIfExists('attendance_days');
        Schema::dropIfExists('attendance_events');
        Schema::dropIfExists('work_schedules');
    }
};
