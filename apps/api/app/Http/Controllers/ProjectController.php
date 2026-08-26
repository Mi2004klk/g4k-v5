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

    private function canManageProject(Request $request, Project $project): bool
    {
        if (!$this->userHasManage($request)) return false;
        if ($request->user()->resolveActiveRole() === 'super_admin') return true;
        
        $deptIds = \App\Support\HrScope::managedDepartmentIds($request->user());
        if (!$project->department_id) {
            return $project->created_by === $request->user()->id || $project->members()->where('users.id', $request->user()->id)->exists();
        }
        return in_array($project->department_id, $deptIds);
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
                '_has_manage' => $this->userHasManage($request),
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
        } elseif ($request->user()->resolveActiveRole() === 'hr') {
            $deptIds = \App\Support\HrScope::managedDepartmentIds($request->user());
            if (empty($deptIds)) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('department_id', $deptIds);
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->query('search') . '%');
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->query('priority'));
        }

        if ($request->filled('sort')) {
            $sort = $request->query('sort');
            $direction = $request->query('direction', 'desc');
            if (in_array($sort, ['created_at', 'deadline', 'name'])) {
                $query->orderBy($sort, $direction);
            } elseif ($sort === 'priority') {
                $query->orderByRaw("
                    CASE priority
                        WHEN 'urgent' THEN 4
                        WHEN 'high' THEN 3
                        WHEN 'medium' THEN 2
                        WHEN 'low' THEN 1
                        ELSE 0
                    END " . ($direction === 'desc' ? 'DESC' : 'ASC')
                );
            } else {
                $query->orderBy('updated_at', 'desc');
            }
        } else {
            $query->orderBy('updated_at', 'desc');
        }

        $perPage = min((int) $request->query('per_page', 15), 100);
        $perPage = max($perPage, 1);
        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        if (!$this->userHasManage($request)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($request->user()->resolveActiveRole() === 'hr') {
            $deptIds = \App\Support\HrScope::managedDepartmentIds($request->user());
            if (empty($deptIds) || ($request->has('department_id') && !in_array($request->input('department_id'), $deptIds))) {
                return response()->json(['message' => 'Unauthorized department for HR project creation.'], 403);
            }
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

        $project = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $request) {
            $project = Project::create(array_merge($validated, [
                'created_by' => $request->user()->id,
                'status' => $validated['status'] ?? 'active',
                'qa_form_id' => $validated['qa_form_id'] ?? null,
                'allow_employee_tasks' => $validated['allow_employee_tasks'] ?? false,
            ]));

            $memberIds = $validated['member_ids'] ?? [];
            if (!empty($memberIds)) {
                $project->members()->sync($memberIds);
                foreach ($memberIds as $memberId) {
                    if ($memberId !== $request->user()->id) {
                        \App\Services\NotificationService::send(
                            $memberId,
                            'project',
                            'Added to Project',
                            "You have been assigned to project: {$project->name}",
                            null,
                            "/dashboard/projects"
                        );
                    }
                }
            }

            // T-21.3: Auto-create a project chat conversation with creator + all members
            $conversationMembers = array_unique(array_merge([$request->user()->id], $memberIds ?? []));
            $conversation = \App\Models\Conversation::create([
                'name' => $project->name,
                'scope' => 'project',
                'project_id' => $project->id,
            ]);
            $conversation->users()->sync($conversationMembers);

            return $project;
        });

        return response()->json($project->load(['team', 'department', 'creator', 'members']), 201);
    }

    public function show(Request $request, $id)
    {
        $project = Project::with(['team', 'department', 'creator', 'members', 'phases', 'tasks.assignee', 'tasks.phase', 'timeLogs', 'qaForm', 'qaSubmission'])->findOrFail($id);

        if (!$this->canManageProject($request, $project)) {
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

        if (!$this->canManageProject($request, $project)) {
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

        if (!$this->canManageProject($request, $project)) {
            return response()->json(['message' => 'Unauthorized to update this project.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,completed,archived',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
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
            
            // Sync project conversation members as well (T-21.3)
            $conversation = \App\Models\Conversation::where('project_id', $project->id)->first();
            if ($conversation) {
                $conversationMembers = array_unique(array_merge([$project->created_by], $validated['member_ids']));
                $conversation->users()->sync($conversationMembers);
            }
        }

        return response()->json($project->load(['team', 'department', 'creator', 'members']));
    }

    public function destroy(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        if (!$this->canManageProject($request, $project)) {
            return response()->json(['message' => 'Unauthorized to delete this project.'], 403);
        }
        
        // Cascade soft delete to tasks and log activity
        $project->tasks()->get()->each(function($task) use ($request) {
            \App\Models\TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => $request->user()->id,
                'event' => 'deleted',
                'metadata' => ['description' => 'Task was deleted along with its project.']
            ]);
            $task->delete();
        });

        $conversation = \App\Models\Conversation::where('scope', 'project')->where('project_id', $project->id)->first();
        if ($conversation) {
            $conversation->delete();
        }

        $project->phases()->delete();
        $project->qaSubmission()->delete();
        $project->delete(); // Soft delete
        
        return response()->json(['message' => 'Project deleted successfully']);
    }

    public function submit(Request $request, $id)
    {
        $project = Project::with(['members'])->findOrFail($id);

        if (!$this->canManageProject($request, $project)) {
            $userId = $request->user()->id;
            if ($project->created_by !== $userId) {
                return response()->json(['message' => 'Only project managers or the creator can submit this project for review.'], 403);
            }
        }

        if ($project->status === 'review') {
            return response()->json(['message' => 'Project is already under review.'], 422);
        }

        $validated = $request->validate([
            'notes' => 'required|string',
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
        \App\Services\DashboardCacheService::invalidateGlobal();

        return response()->json($project->fresh()->load(['approval']));
    }

    public function review(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        
        if (!$this->canManageProject($request, $project)) {
            return response()->json(['message' => 'Unauthorized to review this project.'], 403);
        }

        $approval = $project->approval()->where('status', 'pending')->first();
        
        if (!$approval) {
            return response()->json(['message' => 'No pending approval found'], 404);
        }

        if ($approval->submitted_by === $request->user()->id) {
            return response()->json(['message' => 'You cannot review your own project.'], 403);
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
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        // T-52: Clear pending approvals cache for HR/Admin
        \App\Services\DashboardCacheService::invalidateGlobal();

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

