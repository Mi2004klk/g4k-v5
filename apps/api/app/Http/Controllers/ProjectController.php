<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::with(['team', 'department', 'creator', 'members']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->query('search') . '%');
        }

        $query->orderBy('updated_at', 'desc');

        return response()->json($query->cursorPaginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,completed,archived',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'deadline' => 'nullable|date',
            'team_id' => 'nullable|exists:teams,id',
            'department_id' => 'nullable|exists:departments,id',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'exists:users,id',
        ]);

        $project = Project::create(array_merge($validated, [
            'created_by' => $request->user()->id,
        ]));

        if (!empty($validated['member_ids'])) {
            $project->members()->sync($validated['member_ids']);
        }

        return response()->json($project->load(['team', 'department', 'creator', 'members']));
    }

    public function show($id)
    {
        $project = Project::with(['team', 'department', 'creator', 'members', 'tasks.assignee', 'timeLogs'])->findOrFail($id);
        return response()->json($project);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,completed,archived',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'deadline' => 'nullable|date',
            'team_id' => 'nullable|exists:teams,id',
            'department_id' => 'nullable|exists:departments,id',
            'progress' => 'sometimes|integer|min:0|max:100',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'exists:users,id',
        ]);

        $project->update($validated);

        if (isset($validated['member_ids'])) {
            $project->members()->sync($validated['member_ids']);
        }

        return response()->json($project->load(['team', 'department', 'creator', 'members']));
    }

    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        $project->delete();
        return response()->json(['message' => 'Project deleted successfully']);
    }
}
