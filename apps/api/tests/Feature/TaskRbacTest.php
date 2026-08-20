<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Task;
use App\Models\Project;
use Laravel\Sanctum\Sanctum;

class TaskRbacTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_cannot_approve_task()
    {
        $employee = User::factory()->create();
        $employee->roleAssignments()->create(['role' => 'employee']);

        $task = Task::factory()->create(['status' => 'review']);

        Sanctum::actingAs($employee, ['role:employee']);

        $response = $this->postJson("/api/tasks/{$task->id}/approve");
        $response->assertStatus(403);
    }

    public function test_manager_can_approve_task()
    {
        $hr = User::factory()->create();
        $hr->roleAssignments()->create(['role' => 'hr']);

        $task = Task::factory()->create(['status' => 'review']);

        Sanctum::actingAs($hr, ['role:hr']);

        $response = $this->postJson("/api/tasks/{$task->id}/approve");
        $response->assertStatus(200);
    }

    public function test_non_participant_cannot_log_time()
    {
        $employee = User::factory()->create();
        $employee->roleAssignments()->create(['role' => 'employee']);

        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id]);

        Sanctum::actingAs($employee, ['role:employee']);

        $response = $this->postJson("/api/timer/log", [
            'task_id' => $task->id,
            'minutes_logged' => 30
        ]);
        
        $response->assertStatus(403);
    }

    public function test_assignee_can_log_time()
    {
        $employee = User::factory()->create();
        $employee->roleAssignments()->create(['role' => 'employee']);

        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'assignee_id' => $employee->id]);

        Sanctum::actingAs($employee, ['role:employee']);

        $response = $this->postJson("/api/timer/log", [
            'task_id' => $task->id,
            'minutes_logged' => 30
        ]);
        
        $response->assertStatus(200);
    }
}
