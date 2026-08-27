<?php

namespace App\Http\Controllers;

use App\Models\TaskTimeLog;
use App\Services\CapabilityMatrix;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Events\ActiveTaskUpdated;

class TimerController extends Controller
{
    public function logTime(Request $request)
    {
        $validated = $request->validate([
            'task_id' => 'nullable|exists:tasks,id',
            'project_id' => 'nullable|exists:projects,id',
            'minutes_logged' => 'required|integer|min:1',
            'started_at' => 'nullable|date',
            'ended_at' => 'nullable|date',
            'description' => 'nullable|string',
            'log_date' => 'nullable|date',
        ]);
        $userId = $request->user()->id;
        $activeRole = $request->user()->resolveActiveRole();

        if (!CapabilityMatrix::hasCapability($activeRole, 'timer.track')) {
            return response()->json(['message' => 'Your role is restricted from tracking time.'], 403);
        }

        if (isset($validated['task_id'])) {
            $task = \App\Models\Task::with(['assignees', 'project.members'])->find($validated['task_id']);
            if ($task) {
                $isParticipant = $task->reporter_id === $userId || 
                                 $task->assignee_id === $userId || 
                                 $task->assignees->contains('id', $userId) || 
                                 ($task->project && (
                                     $task->project->created_by === $userId || 
                                     $task->project->members->contains('id', $userId)
                                 ));
                $hasManage = in_array($request->user()->resolveActiveRole(), ['super_admin', 'hr']);

                if (!$isParticipant && !$hasManage) {
                    return response()->json(['message' => 'You are not authorized to log time on this task.'], 403);
                }
            }
        } elseif (isset($validated['project_id'])) {
            $project = \App\Models\Project::with('members')->find($validated['project_id']);
            if ($project) {
                $isParticipant = $project->created_by === $userId || $project->members->contains('id', $userId);
                $hasManage = in_array($request->user()->resolveActiveRole(), ['super_admin', 'hr']);
                if (!$isParticipant && !$hasManage) {
                    return response()->json(['message' => 'You are not authorized to log time on this project.'], 403);
                }
            }
        }

        $log = TaskTimeLog::create(array_merge($validated, [
            'user_id' => $userId,
            'log_date' => $validated['log_date'] ?? now()->toDateString(),
        ]));

        return response()->json($log->load(['task', 'project', 'user']));
    }

    public function index(Request $request)
    {
        $query = TaskTimeLog::with(['task', 'project', 'user']);

        $role = $request->user()->resolveActiveRole();
        $canViewAll = CapabilityMatrix::hasCapability($role, 'hr.view-team-attendance') || CapabilityMatrix::hasCapability($role, 'admin.view-all-attendance');

        if (!$canViewAll) {
            $query->where('user_id', $request->user()->id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->query('project_id'));
        }

        $query->orderBy('created_at', 'desc');

        return response()->json($query->cursorPaginate(20));
    }

    public function setActive(Request $request)
    {
        $validated = $request->validate([
            'task_id' => 'nullable|exists:tasks,id',
            'project_id' => 'required|exists:projects,id',
            'task_title' => 'nullable|string'
        ]);
        $userId = $request->user()->id;
        $activeRole = $request->user()->resolveActiveRole();

        if (!CapabilityMatrix::hasCapability($activeRole, 'timer.track')) {
            return response()->json(['message' => 'Your role is restricted from tracking time.'], 403);
        }

        if (!empty($validated['task_id'])) {
            $task = \App\Models\Task::with(['assignees', 'project.members'])->find($validated['task_id']);
            if ($task) {
                $isParticipant = $task->reporter_id === $userId || 
                                 $task->assignee_id === $userId || 
                                 $task->assignees->contains('id', $userId) || 
                                 ($task->project && (
                                     $task->project->created_by === $userId || 
                                     $task->project->members->contains('id', $userId)
                                 ));
                $hasManage = in_array($request->user()->resolveActiveRole(), ['super_admin', 'hr']);

                if (!$isParticipant && !$hasManage) {
                    return response()->json(['message' => 'You are not authorized to start a timer on this task.'], 403);
                }
            }
        } elseif (!empty($validated['project_id'])) {
            $project = \App\Models\Project::with('members')->find($validated['project_id']);
            if ($project) {
                $isParticipant = $project->created_by === $userId || $project->members->contains('id', $userId);
                $hasManage = in_array($request->user()->resolveActiveRole(), ['super_admin', 'hr']);
                if (!$isParticipant && !$hasManage) {
                    return response()->json(['message' => 'You are not authorized to start a timer on this project.'], 403);
                }
            }
        }

        Cache::put("user_active_task_{$request->user()->id}", [
            'task_id' => $validated['task_id'],
            'project_id' => $validated['project_id'],
            'task_title' => $validated['task_title'] ?? null,
            'started_at' => now()->toIso8601String(),
        ], 43200);

        try {
            broadcast(new ActiveTaskUpdated($request->user()->id, $validated['task_id'], $validated['project_id']));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['message' => 'Active task synced']);
    }

    public function clearActive(Request $request)
    {
        Cache::forget("user_active_task_{$request->user()->id}");
        try {
            broadcast(new ActiveTaskUpdated($request->user()->id));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['message' => 'Active task cleared']);
    }
}

