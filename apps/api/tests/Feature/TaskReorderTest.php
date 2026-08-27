<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Task;
use Laravel\Sanctum\Sanctum;

class TaskReorderTest extends TestCase
{
    use RefreshDatabase;

    public function test_task_reorder_persists_order_and_status()
    {
        $user = User::factory()->create(['active_role' => 'admin']);
        Sanctum::actingAs($user, ['*']);

        $task1 = Task::factory()->create([
            'reporter_id' => $user->id,
            'status' => 'todo',
            'order' => 0
        ]);

        $task2 = Task::factory()->create([
            'reporter_id' => $user->id,
            'status' => 'todo',
            'order' => 1
        ]);

        $response = $this->postJson('/api/tasks/reorder', [
            'tasks' => [
                [
                    'id' => $task1->id,
                    'status' => 'in_progress',
                    'order' => 1
                ],
                [
                    'id' => $task2->id,
                    'status' => 'in_progress',
                    'order' => 0
                ]
            ]
        ]);

        $response->assertStatus(200);

        $task1->refresh();
        $task2->refresh();

        $this->assertEquals('in_progress', $task1->status);
        $this->assertEquals(1, $task1->order);

        $this->assertEquals('in_progress', $task2->status);
        $this->assertEquals(0, $task2->order);
    }
}
