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
                if (isset($task->recurrence['days']) && is_array($task->recurrence['days']) && count($task->recurrence['days']) > 0) {
                    $days = $task->recurrence['days'];
                    // Find the next day in the list of days (0=Sun, 1=Mon, ..., 6=Sat)
                    $currentDayOfWeek = $dueDate->dayOfWeek;
                    $nextDayOfWeek = null;
                    foreach ($days as $day) {
                        if ($day > $currentDayOfWeek) {
                            $nextDayOfWeek = $day;
                            break;
                        }
                    }
                    if ($nextDayOfWeek === null) {
                        // Move to next week and pick the first day in the array
                        $nextDayOfWeek = $days[0];
                        $nextDueDate = $dueDate->addWeek()->startOfWeek()->addDays($nextDayOfWeek === 0 ? 6 : $nextDayOfWeek - 1);
                    } else {
                        $nextDueDate = $dueDate->copy()->next($nextDayOfWeek);
                    }
                }
                break;
            case 'monthly':
                $nextDueDate = $dueDate->addMonth();
                if (isset($task->recurrence['day_of_month'])) {
                    $dayOfMonth = $task->recurrence['day_of_month'];
                    $nextDueDate->day(min($dayOfMonth, $nextDueDate->daysInMonth));
                }
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
