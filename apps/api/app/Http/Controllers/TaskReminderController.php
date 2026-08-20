<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TaskReminder;

class TaskReminderController extends Controller
{
    public function store(Request $request, $taskId)
    {
        $validated = $request->validate([
            'remind_at' => 'required|date',
            'type' => 'nullable|string|in:due_date,personal'
        ]);

        $task = \App\Models\Task::with(['assignees', 'project.members'])->findOrFail($taskId);
        $userId = $request->user()->id;
        $isParticipant = $task->reporter_id === $userId || 
                         $task->assignee_id === $userId || 
                         $task->assignees->contains('id', $userId) || 
                         ($task->project && (
                             $task->project->created_by === $userId || 
                             $task->project->members->contains('id', $userId)
                         ));
        $hasManage = in_array($request->user()->resolveActiveRole(), ['super_admin', 'hr']);

        if (!$isParticipant && !$hasManage) {
            return response()->json(['message' => 'You are not authorized to set a reminder on this task.'], 403);
        }

        $reminder = TaskReminder::create([
            'task_id' => $taskId,
            'user_id' => $request->user()->id,
            'remind_at' => $validated['remind_at'],
            'type' => $validated['type'] ?? 'personal',
            'status' => 'pending'
        ]);

        return response()->json($reminder, 201);
    }

    public function destroy($id)
    {
        $reminder = TaskReminder::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();
            
        $reminder->delete();
        
        return response()->json(['message' => 'Reminder deleted']);
    }
}
