<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\CapabilityMatrix;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    private function userHasManage(Request $request): bool
    {
        $role = str_replace('role:', '', $request->user()->currentAccessToken()->abilities[0] ?? 'employee');
        return CapabilityMatrix::hasCapability($role, 'projects.manage');
    }

    public function index(Request $request)
    {
        $query = Project::with(['team', 'department', 'creator', 'members']);

        if (!$this->userHasManage($request)) {
            $userId = $request->user()->id;
            $query->where(function ($q) use ($userId) {
                $q->where('created_by', $userId)
                  ->orWhereHas('members', fn ($m) => $m->where('users.id', $userId));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->query('search') . '%');
        }

        if ($request->filled('sort')) {
            $sort = $request->query('sort');
            if (in_array($sort, ['created_at', 'deadline', 'priority'])) {
                $query->orderBy($sort, $sort === 'priority' ? 'desc' : 'desc');
            } else {
                $query->orderBy('updated_at', 'desc');
            }
        } else {
            $query->orderBy('updated_at', 'desc');
        }

        return response()->json($query->paginate(15));
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

    public function show(Request $request, $id)
    {
        $project = Project::with(['team', 'department', 'creator', 'members', 'tasks.assignee', 'timeLogs'])->findOrFail($id);

        if (!$this->userHasManage($request)) {
            $userId = $request->user()->id;
            $isMember = $project->created_by === $userId || $project->members->contains('id', $userId);
            if (!$isMember) {
                return response()->json(['message' => 'Unauthorized access to project'], 403);
            }
        }

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

    public function submit(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        
        $approval = \App\Services\ApprovalService::submit($project, $request->user()->id, [
            'notes' => 'Project submission',
        ]);

        $project->update(['status' => 'completed']);
        
        return response()->json($project->load(['approval']));
    }

    public function review(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $approval = $project->approval()->where('status', 'pending')->first();
        
        if (!$approval) {
            return response()->json(['message' => 'No pending approval found'], 404);
        }

        $request->validate([
            'decision' => 'required|in:approved,rejected',
            'reason' => 'nullable|string',
        ]);

        if ($request->input('decision') === 'approved') {
            \App\Services\ApprovalService::approve($approval, $request->user()->id, $request->input('reason'));
        } else {
            \App\Services\ApprovalService::reject($approval, $request->user()->id, $request->input('reason'));
            $project->update(['status' => 'active']); // Revert to active if rejected
        }

        return response()->json($project->load(['approval']));
    }
}
