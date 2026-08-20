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
        $role = $request->user()->resolveActiveRole();
        return CapabilityMatrix::hasCapability($role, 'projects.manage');
    }


    public function export(Request $request)
    {
        $job = \App\Models\ExportJob::create([
            'user_id' => $request->user()->id,
            'report_key' => 'projects',
            'format' => 'csv',
            'status' => 'pending',
            'filters' => [
                'search' => $request->input('search'),
                '_has_manage' => $this->hasManageCapability($request),
                '_user_id' => $request->user()->id,
            ],
        ]);

        dispatch(new \App\Jobs\GenerateReportJob($job));

        return response()->json([
            'message' => 'Export started. You will be notified when it is ready.',
            'job_id' => $job->id,
        ]);
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
            $direction = $request->query('direction', 'desc');
            if (in_array($sort, ['created_at', 'deadline', 'priority', 'name'])) {
                $query->orderBy($sort, $direction);
            } else {
                $query->orderBy('updated_at', 'desc');
            }
        } else {
            $query->orderBy('updated_at', 'desc');
        }

        $perPage = $request->query('per_page', 15);
        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        if (!$this->userHasManage($request)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

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
            'cover_image' => 'nullable|string',
            'qa_form_id' => 'nullable|exists:qa_forms,id',
            'allow_employee_tasks' => 'boolean',
        ]);

        $project = Project::create(array_merge($validated, [
            'created_by' => $request->user()->id,
            'status' => $validated['status'] ?? 'active',
            'qa_form_id' => $validated['qa_form_id'] ?? null,
            'allow_employee_tasks' => $validated['allow_employee_tasks'] ?? false,
        ]));

        $memberIds = $validated['member_ids'] ?? [];
        if (!empty($memberIds)) {
            $project->members()->sync($memberIds);
        }

        // T-21.3: Auto-create a project chat conversation with creator + all members
        $conversationMembers = array_unique(array_merge([$request->user()->id], $memberIds));
        $conversation = \App\Models\Conversation::create([
            'name' => $project->name,
            'scope' => 'project',
            'project_id' => $project->id,
        ]);
        $conversation->users()->sync($conversationMembers);

        return response()->json($project->load(['team', 'department', 'creator', 'members']), 201);
    }

    public function show(Request $request, $id)
    {
        $project = Project::with(['team', 'department', 'creator', 'members', 'tasks.assignee', 'timeLogs', 'qaForm', 'qaSubmission'])->findOrFail($id);

        if (!$this->userHasManage($request)) {
            $userId = $request->user()->id;
            $isMember = $project->created_by === $userId || $project->members->contains('id', $userId);
            if (!$isMember) {
                return response()->json(['message' => 'Unauthorized access to project'], 403);
            }
        }

        // T-46.14: Return real aggregates for project history/detail page
        $totalTasksCount = $project->tasks->count();
        $completedTasksCount = $project->tasks->where('status', 'done')->count();
        $totalTimeMinutes = $project->timeLogs->sum('minutes_logged');
        $totalTimeHours = round($totalTimeMinutes / 60, 1);

        $project->setAttribute('total_tasks_count', $totalTasksCount);
        $project->setAttribute('completed_tasks_count', $completedTasksCount);
        $project->setAttribute('total_time_hours', $totalTimeHours);

        return response()->json($project);
    }

    public function history(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        if (!$this->userHasManage($request)) {
            $userId = $request->user()->id;
            $isMember = $project->created_by === $userId || $project->members->contains('id', $userId);
            if (!$isMember) {
                return response()->json(['message' => 'Unauthorized access to project'], 403);
            }
        }

        $activities = \App\Models\TaskActivity::whereHas('task', function ($q) use ($id) {
            $q->where('project_id', $id);
        })->with(['user', 'task'])->orderBy('created_at', 'desc')->get();

        return response()->json(['data' => $activities]);
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
            'qa_form_id' => 'nullable|exists:qa_forms,id',
            'progress' => 'sometimes|integer|min:0|max:100',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'exists:users,id',
            'allow_employee_tasks' => 'boolean',
            'cover_image' => 'nullable|string'
        ]);

        $oldCoverImage = $project->cover_image;
        $project->update($validated);

        if (array_key_exists('cover_image', $validated) && $oldCoverImage && $oldCoverImage !== $project->cover_image) {
            try {
                $basename = basename(parse_url($oldCoverImage, PHP_URL_PATH));
                \Illuminate\Support\Facades\Storage::disk(config('filesystems.default'))->delete('projects/covers/' . $basename);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Failed to delete old project cover image on update: ' . $e->getMessage());
            }
        }

        if (isset($validated['member_ids'])) {
            $project->members()->sync($validated['member_ids']);
        }

        return response()->json($project->load(['team', 'department', 'creator', 'members']));
    }

    public function destroy(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        
        // Cascade soft delete to tasks and log activity
        $project->tasks()->get()->each(function($task) use ($request) {
            \App\Models\TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => $request->user()->id,
                'action' => 'deleted',
                'description' => 'Task was deleted along with its project.'
            ]);
            $task->delete();
        });

        $project->delete(); // Soft delete
        
        return response()->json(['message' => 'Project deleted successfully']);
    }

    public function submit(Request $request, $id)
    {
        $project = Project::with(['members'])->findOrFail($id);

        if (!$this->userHasManage($request)) {
            $userId = $request->user()->id;
            $isMember = $project->created_by === $userId || $project->members->contains('id', $userId);
            if (!$isMember) {
                return response()->json(['message' => 'Unauthorized access to project'], 403);
            }
        }

        $validated = $request->validate([
            'notes' => 'nullable|string',
            'qa_values' => 'nullable|array',
        ]);

        if ($project->qa_form_id) {
            $form = \App\Models\QaForm::with('fields')->find($project->qa_form_id);
            if ($form) {
                $qaValues = $validated['qa_values'] ?? [];
                foreach ($form->fields as $field) {
                    if ($field->required && (!isset($qaValues[$field->id]) || $qaValues[$field->id] === '' || $qaValues[$field->id] === null)) {
                        return response()->json(['message' => "QA Field '{$field->label}' is required."], 422);
                    }
                }
            }
        }

        if ($project->qa_form_id && !empty($validated['qa_values'])) {
            \App\Models\QaSubmission::updateOrCreate(
                ['project_id' => $project->id],
                [
                    'qa_form_id' => $project->qa_form_id,
                    'user_id' => $request->user()->id,
                    'values' => $validated['qa_values'],
                    'note' => $validated['notes'],
                ]
            );
        }

        // T-21.6: Set status to 'review' (pending-review) NOT completed.
        // completed is only set when an HR/Admin approves the submission.
        $project->update([
            'status' => 'review',
            'submission_note' => $request->input('notes'),
        ]);

        $approval = \App\Services\ApprovalService::submit($project, $request->user()->id, [
            'notes' => $request->input('notes'),
        ]);
        
        // T-52: Clear pending approvals cache for HR/Admin
        $adminIds = \App\Models\User::whereHas('roleAssignments', function($q) { $q->whereIn('role', ['hr', 'super_admin']); })->pluck('id');
        foreach ($adminIds as $adminId) {
            \Illuminate\Support\Facades\Cache::forget("pending_approvals_{$adminId}_hr");
            \Illuminate\Support\Facades\Cache::forget("pending_approvals_{$adminId}_super_admin");
        }

        return response()->json($project->fresh()->load(['approval']));
    }

    public function review(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $approval = $project->approval()->where('status', 'pending')->first();
        
        if (!$approval) {
            return response()->json(['message' => 'No pending approval found'], 404);
        }

        $request->validate([
            'decision' => 'required|in:approved,rejected,redo',
            'reason' => 'nullable|string',
        ]);

        try {
            if ($request->input('decision') === 'approved') {
                \App\Services\ApprovalService::approve($approval, $request->user()->id, $request->input('reason'));
                // T-21.6: Only set completed once HR/Admin approves
                $project->update(['status' => 'completed', 'completed_at' => now()]);
            } elseif ($request->input('decision') === 'redo') {
                \App\Services\ApprovalService::redo($approval, $request->user()->id, $request->input('reason') ?? 'Redo requested');
                $project->update(['status' => 'active']); // Revert to active if redo requested
            } else {
                \App\Services\ApprovalService::reject($approval, $request->user()->id, $request->input('reason'));
                $project->update(['status' => 'active']); // Revert to active if rejected
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422);
        }

        // T-52: Clear pending approvals cache for HR/Admin
        $adminIds = \App\Models\User::whereHas('roleAssignments', function($q) { $q->whereIn('role', ['hr', 'super_admin']); })->pluck('id');
        foreach ($adminIds as $adminId) {
            \Illuminate\Support\Facades\Cache::forget("pending_approvals_{$adminId}_hr");
            \Illuminate\Support\Facades\Cache::forget("pending_approvals_{$adminId}_super_admin");
        }

        return response()->json($project->fresh()->load(['approval']));
    }
    public function uploadCover(Request $request)
    {
        if (!$this->userHasManage($request)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'cover_image' => 'required|image|max:2048',
        ]);

        try {
            $disk = config('filesystems.default');
            $path = $request->file('cover_image')->store('projects/covers', $disk);

            if (!$path) {
                throw new \Exception('Failed to store file');
            }

            return response()->json([
                'url' => \Illuminate\Support\Facades\Storage::disk($disk)->url($path),
                'path' => $path
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Project cover upload failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to upload image. Please check server storage permissions.'], 500);
        }
    }
}

