<?php

namespace App\Http\Controllers;

use App\Models\TaskTimeLog;
use App\Services\CapabilityMatrix;
use Illuminate\Http\Request;

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

        return response()->json($log->load(['task', 'project', 'user']));
    }

    public function index(Request $request)
    {
        $query = TaskTimeLog::with(['task', 'project', 'user']);

        $role = str_replace('role:', '', $request->user()->currentAccessToken()->abilities[0] ?? 'employee');
        $canViewAll = CapabilityMatrix::hasCapability($role, 'reports.view') || CapabilityMatrix::hasCapability($role, 'settings.manage');

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
}
