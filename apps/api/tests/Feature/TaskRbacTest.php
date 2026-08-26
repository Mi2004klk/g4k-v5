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

        $taskId = \Illuminate\Support\Facades\DB::table('tasks')->insertGetId([
            'title' => 'Test Task',
            'status' => 'review',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($employee, ['role:employee']);

        $response = $this->postJson("/api/tasks/{$taskId}/approve");
        $response->assertStatus(403);
    }

    public function test_manager_can_approve_task()
    {
        $hr = User::factory()->create();
        $hr->roleAssignments()->create(['role' => 'hr']);
        \Illuminate\Support\Facades\DB::table('capabilities')->insertOrIgnore([
            ['key' => 'tasks.approve', 'group' => 'Tasks', 'description' => 'Approve Tasks']
        ]);
        \Illuminate\Support\Facades\DB::table('role_capabilities')->insertOrIgnore([
            ['role' => 'hr', 'capability_key' => 'tasks.approve']
        ]);

        $taskId = \Illuminate\Support\Facades\DB::table('tasks')->insertGetId([
            'title' => 'Test Task',
            'status' => 'review',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($hr, ['role:hr']);

        $response = $this->postJson("/api/tasks/{$taskId}/approve");
        $response->assertStatus(200);
    }

    public function test_non_participant_cannot_log_time()
    {
        $employee = User::factory()->create();
        $employee->roleAssignments()->create(['role' => 'employee']);

        $projectId = \Illuminate\Support\Facades\DB::table('projects')->insertGetId([
            'name' => 'Test Project',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        $taskId = \Illuminate\Support\Facades\DB::table('tasks')->insertGetId([
            'project_id' => $projectId,
            'title' => 'Test Task',
            'status' => 'todo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($employee, ['role:employee']);

        $response = $this->postJson("/api/timer/log", [
            'task_id' => $taskId,
            'minutes_logged' => 30
        ]);
        
        $response->assertStatus(403);
    }

    public function test_assignee_can_log_time()
    {
        $employee = User::factory()->create();
        $employee->roleAssignments()->create(['role' => 'employee']);

        $projectId = \Illuminate\Support\Facades\DB::table('projects')->insertGetId([
            'name' => 'Test Project',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        $taskId = \Illuminate\Support\Facades\DB::table('tasks')->insertGetId([
            'project_id' => $projectId,
            'title' => 'Test Task',
            'status' => 'todo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \Illuminate\Support\Facades\DB::table('task_assignees')->insert([
            'task_id' => $taskId,
            'user_id' => $employee->id,
        ]);

        Sanctum::actingAs($employee, ['role:employee']);

        $response = $this->postJson("/api/timer/log", [
            'task_id' => $taskId,
            'minutes_logged' => 30
        ]);
        
        $response->assertStatus(200);
    }
}
