<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\Task;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('project_phases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status', 32)->default('pending'); // pending, active, completed
            $table->unsignedInteger('sort_order')->default(0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('phase_id')->nullable()->after('project_id')->constrained('project_phases')->onDelete('set null');
        });

        // Data Migration: Create a default "General" phase for existing projects with tasks
        // and assign those tasks to the new phase.
        $projectsWithTasks = DB::table('projects')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('tasks')
                      ->whereColumn('tasks.project_id', 'projects.id');
            })
            ->get();

        foreach ($projectsWithTasks as $project) {
            $phaseId = DB::table('project_phases')->insertGetId([
                'project_id' => $project->id,
                'name' => 'General',
                'description' => 'Auto-generated phase for existing tasks',
                'status' => 'active',
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('tasks')
                ->where('project_id', $project->id)
                ->whereNull('phase_id')
                ->update(['phase_id' => $phaseId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['phase_id']);
            $table->dropColumn('phase_id');
        });

        Schema::dropIfExists('project_phases');
    }
};
