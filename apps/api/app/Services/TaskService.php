<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskActivity;
use Exception;

class TaskService
{
    /**
     * Check if setting $blockedByTaskId as the blocker for $taskId creates a cycle.
     */
    public static function hasDependencyCycle(int $taskId, int $blockedByTaskId): bool
    {
        if ($taskId === $blockedByTaskId) {
            return true;
        }

        $visited = [];
        $queue = [$blockedByTaskId];

        while (!empty($queue)) {
            $curr = array_shift($queue);
            if ($curr === $taskId) {
                return true;
            }

            if (!isset($visited[$curr])) {
                $visited[$curr] = true;
                $blockers = Task::where('id', $curr)->pluck('blocked_by')->filter()->toArray();
                foreach ($blockers as $b) {
                    $queue[] = $b;
                }
            }
        }

        return false;
    }

    /**
     * Transition task status safely.
     */
    public static function updateStatus(Task $task, string $newStatus, int $userId): Task
    {
        if ($newStatus === $task->status) {
            return $task;
        }

        // Check if task is blocked by an incomplete task
        if (in_array($newStatus, ['in_progress', 'review', 'done'])) {
            if ($task->blocked_by) {
                $blocker = Task::find($task->blocked_by);
                if ($blocker && $blocker->status !== 'done') {
                    throw new Exception("Cannot move task to {$newStatus} because it is blocked by task #{$blocker->id} ({$blocker->title}).");
                }
            }
        }

        $oldStatus = $task->status;
        $task->update(['status' => $newStatus]);

        TaskActivity::create([
            'task_id' => $task->id,
            'user_id' => $userId,
            'event' => 'progress',
            'metadata' => ['from' => $oldStatus, 'to' => $newStatus],
        ]);

        return $task;
    }
}
