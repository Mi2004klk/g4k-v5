<?php

namespace App\Services;

use App\Models\Task;
use Carbon\Carbon;

class RecurrenceService
{
    /**
     * Recreate recurring task if completed.
     */
    public static function handleCompletion(Task $task): ?Task
    {
        if (empty($task->recurrence) || empty($task->recurrence['type'])) {
            return null;
        }

        $type = $task->recurrence['type']; // daily, weekly, monthly
        $dueDate = $task->due_date ? Carbon::parse($task->due_date) : Carbon::now();

        switch ($type) {
            case 'daily':
                $nextDueDate = $dueDate->addDay();
                break;
            case 'weekly':
                $nextDueDate = $dueDate->addWeek();
                break;
            case 'monthly':
                $nextDueDate = $dueDate->addMonth();
                break;
            default:
                return null;
        }

        $newTask = Task::create([
            'project_id' => $task->project_id,
            'title' => $task->title,
            'description' => $task->description,
            'status' => 'todo',
            'priority' => $task->priority,
            'scope' => $task->scope,
            'assignee_id' => $task->assignee_id,
            'reporter_id' => $task->reporter_id,
            'due_date' => $nextDueDate->toDateString(),
            'progress' => 0,
            'qa_form_id' => $task->qa_form_id,
            'recurrence' => $task->recurrence,
        ]);

        return $newTask;
    }
}
