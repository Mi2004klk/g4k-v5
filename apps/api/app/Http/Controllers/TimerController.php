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

        $log = TaskTimeLog::create(array_merge($validated, [
            'user_id' => $request->user()->id,
            'log_date' => $validated['log_date'] ?? now()->toDateString(),
        ]));

        Cache::forget("user_active_task_{$request->user()->id}");
        broadcast(new ActiveTaskUpdated($request->user()->id));

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

        Cache::put("user_active_task_{$request->user()->id}", [
            'task_id' => $validated['task_id'],
            'project_id' => $validated['project_id'],
            'task_title' => $validated['task_title'] ?? null,
            'started_at' => now()->toIso8601String(),
        ], 43200);

        broadcast(new ActiveTaskUpdated($request->user()->id, $validated['task_id'], $validated['project_id']));

        return response()->json(['message' => 'Active task synced']);
    }

    public function clearActive(Request $request)
    {
        Cache::forget("user_active_task_{$request->user()->id}");
        broadcast(new ActiveTaskUpdated($request->user()->id));

        return response()->json(['message' => 'Active task cleared']);
    }
}

