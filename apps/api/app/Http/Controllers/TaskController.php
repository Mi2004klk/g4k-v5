<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\TaskActivity;
use App\Models\QaSubmission;
use App\Services\TaskService;
use App\Services\RecurrenceService;
use App\Services\ApprovalService;
use App\Services\CapabilityMatrix;
use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\Message;
use App\Events\MessageSent;

class TaskController extends Controller
{
    private function notifyProjectConversation($task, $body)
    {
        try {
            $conv = Conversation::where('scope', 'project')
                ->where('project_id', $task->project_id)
                ->first();
            
            if ($conv) {
                // Find a valid sender to satisfy foreign key (auth user, or task reporter, or first user in chat)
                $senderId = auth()->id();
                if (!$senderId) {
                    $senderId = $task->reporter_id ?? ($conv->users()->first()?->id ?? \App\Models\User::first()?->id);
                }

                if ($senderId) {
                    $msg = Message::create([
                        'conversation_id' => $conv->id,
                        'sender_id' => $senderId,
                        'body' => $body,
                        'type' => 'text', // Avoid 'system' as it is not in the DB enum ['text', 'image', 'file']
                    ]);
                    try {
                        broadcast(new MessageSent($msg))->toOthers();
                    } catch (\Throwable $e) {}
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to notify project chat: " . $e->getMessage());
        }
    }
    private function userHasManage(Request $request): bool
    {
        $role = $request->user()->resolveActiveRole();
        return CapabilityMatrix::hasCapability($role, 'tasks.manage');
    }

    private function canManageTask(Request $request, Task $task): bool
    {
        if (!$this->userHasManage($request)) return false;
        if ($request->user()->resolveActiveRole() === 'super_admin') return true;
        
        $deptIds = \App\Support\HrScope::managedDepartmentIds($request->user());
        
        if ($task->project_id) {
            $task->loadMissing('project');
            if ($task->project && in_array($task->project->department_id, $deptIds)) {
                return true;
            }
        }
        
        $task->loadMissing(['assignees', 'reporter']);
        foreach ($task->assignees as $assignee) {
            if (in_array($assignee->department_id, $deptIds)) return true;
        }
        if ($task->reporter && in_array($task->reporter->department_id, $deptIds)) {
            return true;
        }
        
        return false;
    }

    public function export(Request $request)
    {
        $job = \App\Models\ExportJob::create([
            'user_id' => $request->user()->id,
            'report_key' => 'tasks',
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

    public function bulk(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:tasks,id',
            'action' => 'required|string|in:delete,complete'
        ]);

        $hasManage = $this->userHasManage($request);
        $userId = $request->user()->id;

        if ($validated['action'] === 'complete' && !$hasManage) {
            return response()->json(['message' => 'You do not have permission to bulk complete tasks.'], 403);
        }

        $tasks = Task::whereIn('id', $validated['ids'])->get();
        $updatedCount = 0;

        foreach ($tasks as $task) {
            $canEdit = $this->canManageTask($request, $task) || $task->assignee_id === $userId || $task->reporter_id === $userId;
            if (!$canEdit) continue;

            if ($validated['action'] === 'delete') {
                if (!$this->canManageTask($request, $task) && $task->reporter_id !== $userId) {
                    continue; // Skip assignees for deletion
                }
                $task->delete();
                $updatedCount++;
            } elseif ($validated['action'] === 'complete') {
                if ($task->qa_form_id) {
                    return response()->json(['message' => 'Cannot bulk complete tasks that require QA/submission. Please use the individual submission workflow.'], 422);
                }
                $hasAdmin = $request->user()->roleAssignments->pluck('role')->intersect(['super_admin'])->isNotEmpty();
                if (!$hasAdmin && ($task->assignee_id === $userId || $task->assignees->contains('id', $userId))) {
                    continue; // Skip their own tasks
                }
                \App\Services\TaskService::updateStatus($task, 'done', $userId);
                \App\Services\RecurrenceService::handleCompletion($task);
                $updatedCount++;
            }
        }

        if ($validated['action'] === 'complete' && $updatedCount > 0) {
            \App\Services\DashboardCacheService::invalidateGlobal();
        }

        return response()->json(['message' => "Bulk action {$validated['action']} applied to {$updatedCount} tasks."]);
    }

    /**
     * Field-level policy for non-managers updating a task.
     * Reporters may fully manage their own task except assigning other users;
     * plain assignees may only progress the task (status/progress/due/description).
     */
    private const ASSIGNEE_EDITABLE_FIELDS = ['status', 'progress', 'start_date', 'due_date', 'description', 'notify_global_chat'];

    private function isTaskParticipant(Task $task, int $userId): bool
    {
        return $task->assignee_id === $userId
            || $task->reporter_id === $userId
            || $task->assignees->contains('id', $userId)
            || ($task->project && (
                $task->project->created_by === $userId
                || $task->project->members->contains('id', $userId)
            ));
    }

    public function index(Request $request)
    {
        $query = Task::with(['project', 'assignees', 'assignee', 'reporter', 'blocker', 'qaForm', 'personalReminder']);

        $activeRole = $request->user()->resolveActiveRole();

        if (!$this->userHasManage($request)) {
            $userId = $request->user()->id;
            $query->where(function ($q) use ($userId) {
                $q->where('assignee_id', $userId)
                  ->orWhere('reporter_id', $userId)
                  ->orWhereHas('assignees', fn ($aq) => $aq->where('users.id', $userId))
                  ->orWhereHas('project', function ($pq) use ($userId) {
                      $pq->where('created_by', $userId)
                        ->orWhereHas('members', fn ($m) => $m->where('users.id', $userId));
                  });
            });
        } elseif ($activeRole === 'hr') {
            $userId = $request->user()->id;
            $deptIds = \App\Support\HrScope::managedDepartmentIds($request->user());
            if (empty($deptIds)) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where(function ($q) use ($userId, $deptIds) {
                    $q->whereHas('project', function($pq) use ($deptIds) {
                          $pq->whereIn('department_id', $deptIds);
                      })
                      ->orWhereHas('assignees', function($aq) use ($deptIds) {
                          $aq->whereIn('users.department_id', $deptIds);
                      })
                      ->orWhereHas('reporter', function($rq) use ($deptIds) {
                          $rq->whereIn('users.department_id', $deptIds);
                      })
                      ->orWhere('assignee_id', $userId)
                      ->orWhere('reporter_id', $userId);
                });
            }
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->query('project_id'));
        }

        if ($request->filled('assignee_id')) {
            $query->where('assignee_id', $request->query('assignee_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->query('priority'));
        }

        if ($request->filled('scope')) {
            $query->where('scope', $request->query('scope'));
        }

        if ($request->filled('scope_id')) {
            $query->where('scope_id', $request->query('scope_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('due_date', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('due_date', '<=', $request->query('date_to'));
        }

        if ($request->filled('overdue') && $request->query('overdue') === 'true') {
            $query->whereDate('due_date', '<', now()->toDateString())
                  ->where('status', '!=', 'done');
        }

        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->query('search') . '%');
        }

        $sortBy = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');
        $allowedSortColumns = ['id', 'created_at', 'start_date', 'due_date', 'priority', 'status', 'title', 'order'];
        
        if (in_array($sortBy, $allowedSortColumns)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $request->validate(['per_page' => 'nullable|integer|min:1|max:1000']);
        $perPage = $request->input('per_page', 20);
        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:todo,in_progress,review,done',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'scope' => 'nullable|in:global,department,role,individual',
            'scope_id' => 'nullable|integer',
            'assignees' => 'nullable|array',
            'assignees.*' => 'exists:users,id',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'parent_id' => 'nullable|exists:tasks,id',
            'phase_id' => 'nullable|exists:project_phases,id',
            'blocked_by' => 'nullable|exists:tasks,id',
            'qa_form_id' => 'nullable|exists:qa_forms,id',
            'recurrence' => 'nullable|array',
        ]);

        $user = $request->user();
        $activeRole = $request->user()->resolveActiveRole();

        // Task-creation policy (T-22.2 / T-52.6): managers create anything.
        // Employees may always create their own personal (My Tasks) entry, and
        // project tasks only when the project opts in via allow_employee_tasks.
        $isPersonalForSelf = empty($validated['project_id']) && in_array($user->id, $validated['assignees'] ?? []);
        if ($isPersonalForSelf && !CapabilityMatrix::hasCapability($activeRole, 'tasks.create-own')) {
            return response()->json(['message' => 'Your role is restricted from having personal tasks.'], 403);
        }

        if (!$this->userHasManage($request)) {
            if (!empty($validated['project_id'])) {
                $project = \App\Models\Project::find($validated['project_id']);
                if (!$project || !$project->allow_employee_tasks) {
                    return response()->json(['message' => 'You can only add tasks to this project if enabled by HR.'], 403);
                }
            }

            // Self-service creation may only target the creator themselves.
            $selfAssignments = [$user->id];
            if (!empty($validated['assignees']) && array_diff($validated['assignees'], $selfAssignments)) {
                return response()->json(['message' => 'You can only assign personal tasks to yourself.'], 403);
            }
            $validated['assignees'] = $selfAssignments;
            $validated['scope'] = 'individual';
            $validated['scope_id'] = null;
        } elseif ($activeRole === 'hr') {
            $deptIds = \App\Support\HrScope::managedDepartmentIds($request->user());
            
            if (!empty($validated['project_id'])) {
                $project = \App\Models\Project::find($validated['project_id']);
                if ($project && !in_array($project->department_id, $deptIds)) {
                    return response()->json(['message' => 'You can only add tasks to projects within your managed departments.'], 403);
                }
            }
            
            if (!empty($validated['assignees'])) {
                $assignees = \App\Models\User::whereIn('id', $validated['assignees'])->get();
                foreach ($assignees as $assignee) {
                    if (!in_array($assignee->department_id, $deptIds)) {
                        return response()->json(['message' => 'You can only assign tasks to employees within your managed departments.'], 403);
                    }
                }
            }
        }

        $scope = $validated['scope'] ?? 'global';
        $scopeId = $validated['scope_id'] ?? null;
        
        if ($this->userHasManage($request)) {
            if ($scope === 'global') {
                $validated['assignees'] = \App\Models\User::where('active_role', '!=', 'super_admin')->pluck('id')->toArray();
            } elseif ($scope === 'department' && $scopeId) {
                $validated['assignees'] = \App\Models\User::where('department_id', $scopeId)->pluck('id')->toArray();
            } elseif ($scope === 'role' && $scopeId) {
                $validated['assignees'] = \App\Models\User::where('designation_id', $scopeId)->pluck('id')->toArray();
            }
        }

        $assigneeId = null;
        if (!empty($validated['assignees'])) {
            $assigneeId = $validated['assignees'][0];
        }

        $task = Task::create(array_merge($validated, [
            'reporter_id' => $user->id,
            'assignee_id' => $assigneeId,
        ]));

        if (!empty($validated['assignees'])) {
            $task->assignees()->sync($validated['assignees']);
        }

        \App\Services\AuditLogger::log($request, 'create', \App\Models\Task::class, $task->id, null, $task->toArray());

        TaskActivity::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'event' => 'created',
            'metadata' => ['title' => $task->title],
        ]);

        if (!empty($validated['assignees'])) {
            foreach ($validated['assignees'] as $uid) {
                \App\Services\NotificationService::send(
                    (int) $uid,
                    'task_assigned',
                    'New Task Assigned',
                    "You have been assigned a new task: {$task->title}",
                    ['task_id' => $task->id],
                    "/dashboard/tasks/{$task->id}"
                );
            }
        }

        if ($request->boolean('notify_global_chat')) {
            $globalConv = \App\Models\Conversation::where('scope', 'global')->first();
            if ($globalConv) {
                $assigneeName = $task->assignee ? $task->assignee->name : 'Unassigned';
                $msg = \App\Models\Message::create([
                    'conversation_id' => $globalConv->id,
                    'sender_id' => $request->user()->id,
                    'body' => "📋 **Quick Task Assigned**: \"{$task->title}\" to {$assigneeName}",
                    'type' => 'text',
                ]);
                try {
                    broadcast(new \App\Events\MessageSent($msg))->toOthers();
                } catch (\Throwable $e) {}
            }
        }

        if ($task->project_id) {
            try {
                broadcast(new \App\Events\TaskCreated($task))->toOthers();
            } catch (\Throwable $e) {}
        }

        return response()->json($task->load(['project', 'assignees', 'assignee', 'reporter', 'blocker', 'qaForm']), 201);
    }

    public function show(Request $request, $id)
    {
        $task = Task::with(['project.members', 'assignees', 'assignee', 'reporter', 'blocker', 'qaForm', 'qaSubmission', 'comments.user', 'activities.user', 'timeLogs.user', 'approval', 'personalReminder'])->findOrFail($id);

        if (!$this->userHasManage($request)) {
            $userId = $request->user()->id;
            $isAllowed = $task->assignee_id === $userId || $task->reporter_id === $userId || $task->assignees->contains('id', $userId);

            if (!$isAllowed && $task->project) {
                $isAllowed = $task->project->created_by === $userId || $task->project->members->contains('id', $userId);
            }

            if (!$isAllowed) {
                return response()->json(['message' => 'Unauthorized access to task'], 403);
            }
        }

        return response()->json($task);
    }

    public function update(Request $request, $id)
    {
        $task = Task::with(['assignees', 'project'])->findOrFail($id);
        $user = $request->user();
        $isManage = $this->canManageTask($request, $task);
        $isReporter = $task->reporter_id === $user->id;

        if (!$isManage && !$isReporter && !$task->assignees->contains('id', $user->id)) {
            return response()->json(['message' => 'You can only update tasks assigned to or created by you.'], 403);
        }

        // Plain assignees (not the reporter) may only progress the task.
        if (!$isManage && !$isReporter) {
            $request->replace($request->only(self::ASSIGNEE_EDITABLE_FIELDS));
        } elseif (!$isManage && $isReporter && $request->filled('assignees')) {
            // Reporters may not hand their task to other users; keep the current set.
            $request->merge(['assignees' => $task->assignees->pluck('id')->values()->all()]);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:todo,in_progress,review,done',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'scope' => 'sometimes|in:global,department,role,individual',
            'scope_id' => 'nullable|integer',
            'assignees' => 'nullable|array',
            'assignees.*' => 'exists:users,id',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'progress' => 'sometimes|integer|min:0|max:100',
            'phase_id' => 'nullable|exists:project_phases,id',
            'blocked_by' => 'nullable|exists:tasks,id',
            'qa_form_id' => 'nullable|exists:qa_forms,id',
            'recurrence' => 'nullable|array',
            'notify_global_chat' => 'sometimes|boolean',
        ]);

        if (isset($validated['blocked_by']) && $validated['blocked_by'] !== null) {
            if (TaskService::hasDependencyCycle($task->id, $validated['blocked_by'])) {
                return response()->json(['message' => 'Dependency cycle detected.'], 422);
            }
        }

        if (isset($validated['status']) && $validated['status'] !== $task->status) {
            if (!$isManage && in_array($validated['status'], ['review', 'done'])) {
                return response()->json(['message' => "You cannot change the status directly to {$validated['status']}. Please use the 'Submit for Review' option."], 403);
            }

            if ($validated['status'] === 'done') {
                $hasAdmin = $user->roleAssignments->pluck('role')->intersect(['super_admin'])->isNotEmpty();
                if (!$hasAdmin && ($task->assignee_id === $user->id || $task->assignees->contains('id', $user->id))) {
                    return response()->json(['message' => 'You cannot approve your own task.'], 403);
                }
            }

            if (in_array($validated['status'], ['review', 'done']) && !$request->has('submission_note')) {
                if (!$isManage || $task->qa_form_id) {
                    // Default to a system note instead of rejecting, for smooth Kanban drag-and-drop
                    if (!$task->qa_form_id) {
                        $request->merge(['submission_note' => "Moved to {$validated['status']} via Kanban."]);
                    } else {
                        return response()->json(['message' => "A submission note is required to move the task to {$validated['status']}. Please use the submit for review option."], 422);
                    }
                }
            }
            if ($validated['status'] === 'done' && $task->qa_form_id) {
                return response()->json(['message' => 'This task requires QA. Please use the submit for review option.'], 422);
            }
            if ($validated['status'] === 'review' && $task->qa_form_id) {
                return response()->json(['message' => 'This task requires QA form submission. Please use the submit for review option.'], 422);
            }

            TaskService::updateStatus($task, $validated['status'], $user->id);
            if ($validated['status'] === 'done') {
                RecurrenceService::handleCompletion($task);

                // Notify project chat
                if ($task->project_id) {
                    $this->notifyProjectConversation($task, "✅ **Task Completed**: \"{$task->title}\" was marked as done by " . $user->name);
                }

                $shouldNotify = $request->input('notify_global_chat', false) || $task->scope === 'global';
                if ($shouldNotify) {
                    try {
                        event(new \App\Events\TaskCompleted($task, $user));
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::warning("Failed to dispatch TaskCompleted event: " . $e->getMessage());
                    }
                }
            }
        }

        $scope = $validated['scope'] ?? $task->scope;
        $scopeId = array_key_exists('scope_id', $validated) ? $validated['scope_id'] : $task->scope_id;
        
        if ($isManage) {
            if (array_key_exists('scope', $validated) || array_key_exists('scope_id', $validated)) {
                if ($scope === 'global') {
                    $validated['assignees'] = \App\Models\User::where('active_role', '!=', 'super_admin')->pluck('id')->toArray();
                } elseif ($scope === 'department' && $scopeId) {
                    $validated['assignees'] = \App\Models\User::where('department_id', $scopeId)->pluck('id')->toArray();
                } elseif ($scope === 'role' && $scopeId) {
                    $validated['assignees'] = \App\Models\User::where('designation_id', $scopeId)->pluck('id')->toArray();
                }
            }
        } else {
            unset($validated['scope']);
            unset($validated['scope_id']);
        }

        if (isset($validated['assignees'])) {
            // Capture the pre-change assignee set BEFORE syncing so newly added
            // assignees can be notified.
            $existingAssignees = $task->assignees->pluck('id')->toArray();
            $task->assignees()->sync($validated['assignees']);

            $assigneeId = null;
            if (!empty($validated['assignees'])) {
                $assigneeId = $validated['assignees'][0];
            }
            $validated['assignee_id'] = $assigneeId;

            $newAssignees = array_diff($validated['assignees'], $existingAssignees);
            foreach ($newAssignees as $uid) {
                \App\Services\NotificationService::send(
                    (int) $uid,
                    'task_assigned',
                    'Task Assigned to You',
                    "You have been assigned the task: {$task->title}",
                    ['task_id' => $task->id],
                    "/dashboard/tasks/{$task->id}"
                );
            }
        }

        $before = $task->toArray();
        $task->update($validated);
        \App\Services\AuditLogger::log($request, 'update', \App\Models\Task::class, $task->id, $before, $task->fresh()->toArray());

        if ($task->project_id) {
            try {
                broadcast(new \App\Events\TaskUpdated($task))->toOthers();
            } catch (\Throwable $e) {}
        }

        return response()->json($task->load(['project', 'assignees', 'assignee', 'reporter', 'blocker', 'qaForm']));
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'tasks' => 'required|array',
            'tasks.*.id' => 'required|exists:tasks,id',
            'tasks.*.order' => 'required|integer',
            'tasks.*.status' => 'required|string|in:todo,in_progress,review,done',
        ]);

        $isManage = $this->userHasManage($request);
        foreach ($validated['tasks'] as $taskData) {
            $task = Task::with('assignees')->find($taskData['id']);
            if ($task) {
                if (!$this->canManageTask($request, $task)
                    && $task->reporter_id !== $request->user()->id
                    && !$task->assignees->contains('id', $request->user()->id)) {
                    continue;
                }
                if ($task->status !== $taskData['status']) {
                    if (in_array($taskData['status'], ['review', 'done'])) {
                        if (!$isManage || $task->qa_form_id) {
                            return response()->json(['message' => "Cannot move task to {$taskData['status']} directly. Please use the proper submission/approval workflow."], 422);
                        }
                    }
                    try {
                        TaskService::updateStatus($task, $taskData['status'], $request->user()->id);
                    } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
                        return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
                    } catch (\Exception $e) {
                        return response()->json(['message' => $e->getMessage()], 422);
                    }
                }
                $task->update(['order' => $taskData['order']]);
            }
        }

        return response()->json(['message' => 'Tasks reordered successfully']);
    }

    public function submitForReview(Request $request, $id)
    {
        $task = Task::with('assignees')->findOrFail($id);

        if (!$this->canManageTask($request, $task)
            && $task->reporter_id !== $request->user()->id
            && !$task->assignees->contains('id', $request->user()->id)) {
            return response()->json(['message' => 'Only the task assignee can submit this task for review.'], 403);
        }

        $validated = $request->validate([
            'submission_note' => 'required|string',
            'qa_values' => 'nullable|array',
        ]);

        if ($task->blocked_by) {
            $blocker = Task::find($task->blocked_by);
            if ($blocker && $blocker->status !== 'done') {
                return response()->json(['message' => "Cannot submit task for review because it is blocked by task #{$blocker->id} ({$blocker->title})."], 422);
            }
        }

        if ($task->qa_form_id) {
            $form = \App\Models\QaForm::with('fields')->find($task->qa_form_id);
            if ($form) {
                $qaValues = $validated['qa_values'] ?? [];
                foreach ($form->fields as $field) {
                    $val = $qaValues[$field->id] ?? null;

                    if ($field->required && ($val === '' || $val === null || (is_array($val) && empty($val)))) {
                        return response()->json(['message' => "QA Field '{$field->label}' is required."], 422);
                    }

                    if ($val !== null && $val !== '') {
                        if (in_array($field->field_type, ['dropdown', 'multiple_choice', 'checkbox']) && !empty($field->options)) {
                            $vals = is_array($val) ? $val : [$val];
                            foreach ($vals as $v) {
                                if (!in_array($v, $field->options)) {
                                    return response()->json(['message' => "Invalid option '{$v}' for '{$field->label}'."], 422);
                                }
                            }
                        }

                        if (in_array($field->field_type, ['number', 'linear_scale', 'rating', 'slider'])) {
                            if (!is_numeric($val)) {
                                return response()->json(['message' => "QA Field '{$field->label}' must be a number."], 422);
                            }
                            $numVal = (float)$val;
                            $min = $field->config['scale_min'] ?? $field->validation['min'] ?? null;
                            $max = $field->config['scale_max'] ?? $field->validation['max'] ?? ($field->field_type === 'rating' ? ($field->config['rating_max'] ?? 5) : null);
                            
                            if ($min !== null && $numVal < (float)$min) {
                                return response()->json(['message' => "QA Field '{$field->label}' must be at least {$min}."], 422);
                            }
                            if ($max !== null && $numVal > (float)$max) {
                                return response()->json(['message' => "QA Field '{$field->label}' must not exceed {$max}."], 422);
                            }
                        }
                    }
                }
            }
        }

        if ($task->blocked_by) {
            $blocker = Task::find($task->blocked_by);
            if ($blocker && $blocker->status !== 'done') {
                return response()->json(['message' => "Cannot submit for review because it is blocked by task #{$blocker->id} ({$blocker->title})."], 422);
            }
        }

        if ($task->qa_form_id && !empty($validated['qa_values'])) {
            QaSubmission::updateOrCreate(
                ['task_id' => $task->id],
                [
                    'qa_form_id' => $task->qa_form_id,
                    'user_id' => $request->user()->id,
                    'values' => $validated['qa_values'],
                    'note' => $validated['submission_note'],
                ]
            );
        }

        $task->update([
            'status' => 'review',
            'submitted_at' => now(),
            'submission_note' => $validated['submission_note'],
        ]);

        $approval = ApprovalService::submit($task, $request->user()->id, [
            'submission_note' => $validated['submission_note'],
        ]);

        TaskActivity::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'event' => 'submitted',
            'metadata' => ['note' => $validated['submission_note']],
        ]);

        if ($task->project_id) {
            $this->notifyProjectConversation($task, "📝 **Task Submitted for Review**: \"{$task->title}\" by " . $request->user()->name);
        }

        // T-52: Clear pending approvals cache for HR/Admin
        \App\Services\DashboardCacheService::invalidateGlobal();

        return response()->json($task->load(['approval', 'qaSubmission']));
    }

    public function addComment(Request $request, $id)
    {
        $task = Task::with(['assignees', 'project.members'])->findOrFail($id);

        if (!$this->canManageTask($request, $task) && !$this->isTaskParticipant($task, $request->user()->id)) {
            return response()->json(['message' => 'Unauthorized access to task'], 403);
        }

        $validated = $request->validate([
            'body' => 'required|string',
            'parent_id' => 'nullable|exists:task_comments,id',
        ]);

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        return response()->json($comment->load('user'));
    }

    public function deleteComment(Request $request, $id)
    {
        $comment = TaskComment::with('task')->findOrFail($id);
        if (!$this->canManageTask($request, $comment->task) && $comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized to delete this comment'], 403);
        }
        $comment->delete();
        return response()->json(['message' => 'Comment deleted']);
    }

    public function destroy(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        if (!$this->canManageTask($request, $task) && $task->reporter_id !== $request->user()->id) {
            return response()->json(['message' => 'You can only delete tasks you created.'], 403);
        }



        $before = $task->toArray();
        $task->delete();
        \App\Services\AuditLogger::log($request, 'delete', \App\Models\Task::class, $task->id, $before, null);
        return response()->json(['message' => 'Task deleted successfully']);
    }

    public function approve(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        if (!$this->canManageTask($request, $task)) {
            return response()->json(['message' => 'You do not have permission to review this task.'], 403);
        }
        
        if ($task->assignee_id === $request->user()->id || $task->assignees->contains('id', $request->user()->id)) {
            return response()->json(['message' => 'You cannot review your own task.'], 403);
        }
        
        $approval = \App\Models\Approval::where('approvable_type', get_class($task))
            ->where('approvable_id', $task->id)
            ->where('status', 'pending')
            ->orderBy('id', 'desc')
            ->first();

        if (!$approval) {
            return response()->json(['message' => 'Task has no pending approval.'], 422);
        }

        ApprovalService::approve($approval, $request->user()->id);

        TaskService::updateStatus($task, 'done', $request->user()->id);
        \App\Services\AuditLogger::log($request, 'approve', \App\Models\Task::class, $task->id, null, ['decision' => 'approved']);

        $newTask = \App\Services\RecurrenceService::handleCompletion($task);
        if ($newTask) {
            $hrUsers = \App\Models\User::whereHas('roleAssignments', fn($q) => $q->whereIn('role', ['hr', 'super_admin']))->get();
            foreach ($hrUsers as $hr) {
                \App\Services\NotificationService::send(
                    $hr->id,
                    'task_recurrence',
                    'Recurring Task Approved',
                    "The recurring task '{$task->title}' was approved and its next occurrence has been auto-created.",
                    ['task_id' => $newTask->id],
                    $newTask->project_id ? "/dashboard/projects/{$newTask->project_id}?tab=tasks&task={$newTask->id}" : "/dashboard/tasks"
                );
            }
        }

        TaskActivity::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'event' => 'approved',
            'metadata' => [],
        ]);

        if ($task->project_id) {
            $msg = "✅ **Task Approved & Completed**: \"{$task->title}\" was approved by " . $request->user()->name;
            if ($request->filled('optional_message')) {
                $msg .= "\n\n**Note**: " . $request->input('optional_message');
            }
            $this->notifyProjectConversation($task, $msg);
        }

        if ($task->scope === 'global') {
            try {
                event(new \App\Events\TaskCompleted($task, $request->user()));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to dispatch TaskCompleted event: " . $e->getMessage());
            }
        }

        foreach ($task->assignees as $assignee) {
            if ($approval && $assignee->id === $approval->submitted_by) {
                continue; // ProcessApprovalDecision already notified this user
            }
            
            \App\Services\NotificationService::send(
                (int) $assignee->id,
                'task_assigned', // Reusing task_assigned or system
                'Task Approved',
                "Your task '{$task->title}' has been approved.",
                ['task_id' => $task->id],
                "/dashboard/tasks/{$task->id}"
            );
        }

        \App\Services\DashboardCacheService::invalidateGlobal();

        return response()->json($task->fresh(['approval']));
    }

    public function redo(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        if (!$this->canManageTask($request, $task)) {
            return response()->json(['message' => 'You do not have permission to review this task.'], 403);
        }
        
        $hasAdmin = $request->user()->roleAssignments->pluck('role')->intersect(['super_admin'])->isNotEmpty();
        if (!$hasAdmin && ($task->assignee_id === $request->user()->id || $task->assignees->contains('id', $request->user()->id))) {
            return response()->json(['message' => 'You cannot review your own task.'], 403);
        }
        
        $approval = \App\Models\Approval::where('approvable_type', get_class($task))
            ->where('approvable_id', $task->id)
            ->where('status', 'pending')
            ->orderBy('id', 'desc')
            ->first();

        if (!$approval) {
            return response()->json(['message' => 'Task has no pending approval.'], 422);
        }

        $validated = $request->validate(['reason' => 'required|string']);
        
        ApprovalService::redo($approval, $request->user()->id, $validated['reason']);

        TaskService::updateStatus($task, 'in_progress', $request->user()->id);
        \App\Services\AuditLogger::log($request, 'redo', \App\Models\Task::class, $task->id, null, ['decision' => 'redo', 'reason' => $validated['reason']]);

        TaskActivity::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'event' => 'redo',
            'metadata' => ['reason' => $validated['reason']],
        ]);

        \App\Services\DashboardCacheService::invalidateGlobal();

        foreach ($task->assignees as $assignee) {
            if ($approval && $assignee->id === $approval->submitted_by) {
                continue; // ProcessApprovalDecision already notified this user
            }
            \App\Services\NotificationService::send(
                (int) $assignee->id,
                'task_assigned',
                'Task Needs Redo',
                "Your task '{$task->title}' needs redo. Reason: {$validated['reason']}",
                ['task_id' => $task->id],
                "/dashboard/tasks/{$task->id}"
            );
        }

        return response()->json($task->fresh(['approval']));
    }

    public function submitted(Request $request)
    {
        // Reviewers (tasks.manage) see every submission in their queue;
        // everyone else sees only their own submitted work.
        $query = Task::with(['project', 'phase', 'approval', 'assignee', 'reporter'])
            ->where('status', 'review')
            ->orderBy('submitted_at', 'desc');

        $activeRole = $request->user()->resolveActiveRole();

        if (!$this->userHasManage($request)) {
            $userId = $request->user()->id;
            $query->where(function ($q) use ($userId) {
                $q->where('assignee_id', $userId)
                  ->orWhere('reporter_id', $userId)
                  ->orWhereHas('assignees', fn ($aq) => $aq->where('users.id', $userId));
            });
        } elseif ($activeRole === 'hr') {
            $userId = $request->user()->id;
            $deptIds = \App\Support\HrScope::managedDepartmentIds($request->user());
            if (empty($deptIds)) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where(function ($q) use ($userId, $deptIds) {
                    $q->whereHas('project', function($pq) use ($deptIds) {
                          $pq->whereIn('department_id', $deptIds);
                      })
                      ->orWhereHas('assignees', function($aq) use ($deptIds) {
                          $aq->whereIn('users.department_id', $deptIds);
                      })
                      ->orWhereHas('reporter', function($rq) use ($deptIds) {
                          $rq->whereIn('users.department_id', $deptIds);
                      })
                      ->orWhere('assignee_id', $userId)
                      ->orWhere('reporter_id', $userId);
                });
            }
        }

        $tasks = $query->get()->map(function ($task) {
            $approvalState = 'pending_approval';
            $feedback = null;
            if ($task->approval) {
                if ($task->approval->decision === 'approved') {
                    $approvalState = 'approved';
                } elseif ($task->approval->decision === 'redo') {
                    $approvalState = 'redo_required';
                    $feedback = $task->approval->feedback;
                }
            }

            return [
                'id' => $task->id,
                'title' => $task->title,
                'submitted_at' => $task->submitted_at,
                'approval_state' => $approvalState,
                'feedback' => $feedback,
            ];
        });

        return response()->json(['data' => $tasks]);
    }
}

