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
                ->where('entity_id', $task->project_id)
                ->first();
            
            if ($conv) {
                $msg = Message::create([
                    'conversation_id' => $conv->id,
                    'sender_id' => auth()->id() ?? 1, // System fallback if no auth
                    'body' => $body,
                    'type' => 'system',
                ]);
                broadcast(new MessageSent($msg))->toOthers();
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to notify project chat: " . $e->getMessage());
        }
    }
    private function userHasManage(Request $request): bool
    {
        $role = $request->user()->active_role ?? 'employee';
        return CapabilityMatrix::hasCapability($role, 'tasks.manage');
    }

    /**
     * Field-level policy for non-managers updating a task.
     * Reporters may fully manage their own task except assigning other users;
     * plain assignees may only progress the task (status/progress/due/description).
     */
    private const ASSIGNEE_EDITABLE_FIELDS = ['status', 'progress', 'due_date', 'description', 'notify_global_chat'];

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
        $query = Task::with(['project', 'assignees', 'assignee', 'reporter', 'blocker', 'qaForm']);

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

        if ($request->filled('search')) {
            $query->where('title', 'ilike', '%' . $request->query('search') . '%');
        }

        $sortBy = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');
        $allowedSortColumns = ['id', 'created_at', 'due_date', 'priority', 'status', 'title', 'order'];
        
        if (in_array($sortBy, $allowedSortColumns)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $request->validate(['per_page' => 'nullable|integer|in:20,50,100']);
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
            'scope' => 'nullable|in:global,department,role',
            'assignees' => 'nullable|array',
            'assignees.*' => 'exists:users,id',
            'due_date' => 'nullable|date',
            'parent_id' => 'nullable|exists:tasks,id',
            'blocked_by' => 'nullable|exists:tasks,id',
            'qa_form_id' => 'nullable|exists:qa_forms,id',
            'recurrence' => 'nullable|array',
        ]);

        $user = $request->user();

        if (!empty($validated['blocked_by']) && isset($validated['parent_id'])) {
            if (TaskService::hasDependencyCycle($validated['parent_id'], $validated['blocked_by'])) {
                return response()->json(['message' => 'Dependency cycle detected.'], 422);
            }
        }

        // Task-creation policy (T-22.2 / T-52.6): managers create anything.
        // Employees may always create their own personal (My Tasks) entry, and
        // project tasks only when the project opts in via allow_employee_tasks.
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
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning("Failed to broadcast MessageSent event: " . $e->getMessage());
                }
            }
        }

        return response()->json($task->load(['project', 'assignees', 'assignee', 'reporter', 'blocker', 'qaForm']));
    }

    public function show(Request $request, $id)
    {
        $task = Task::with(['project.members', 'assignees', 'assignee', 'reporter', 'blocker', 'qaForm', 'qaSubmission', 'comments.user', 'activities.user', 'timeLogs.user', 'approval'])->findOrFail($id);

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
        $isManage = $this->userHasManage($request);
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
            'assignees' => 'nullable|array',
            'assignees.*' => 'exists:users,id',
            'due_date' => 'nullable|date',
            'progress' => 'sometimes|integer|min:0|max:100',
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
            TaskService::updateStatus($task, $validated['status'], $user->id);
            if ($validated['status'] === 'done') {
                RecurrenceService::handleCompletion($task);

                // Notify project chat
                if ($task->project_id) {
                    $this->notifyProjectConversation($task, "✅ **Task Completed**: \"{$task->title}\" was marked as done by " . $user->name);
                }

                $shouldNotify = $request->input('notify_global_chat', true);
                if ($shouldNotify) {
                    try {
                        event(new \App\Events\TaskCompleted($task, $user));
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::warning("Failed to dispatch TaskCompleted event: " . $e->getMessage());
                    }
                }
            }
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

        $task->update($validated);

        return response()->json($task->load(['project', 'assignees', 'assignee', 'reporter', 'blocker', 'qaForm']));
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'tasks' => 'required|array',
            'tasks.*.id' => 'required|exists:tasks,id',
            'tasks.*.order' => 'required|integer',
            'tasks.*.status' => 'required|string',
        ]);

        $isManage = $this->userHasManage($request);
        foreach ($validated['tasks'] as $taskData) {
            $task = Task::with('assignees')->find($taskData['id']);
            if ($task) {
                if (!$isManage
                    && $task->reporter_id !== $request->user()->id
                    && !$task->assignees->contains('id', $request->user()->id)) {
                    continue;
                }
                if ($task->status !== $taskData['status']) {
                    TaskService::updateStatus($task, $taskData['status'], $request->user()->id);
                }
                $task->update(['order' => $taskData['order']]);
            }
        }

        return response()->json(['message' => 'Tasks reordered successfully']);
    }

    public function submitForReview(Request $request, $id)
    {
        $task = Task::with('assignees')->findOrFail($id);

        if (!$this->userHasManage($request)
            && $task->reporter_id !== $request->user()->id
            && !$task->assignees->contains('id', $request->user()->id)) {
            return response()->json(['message' => 'Only the task assignee can submit this task for review.'], 403);
        }

        $validated = $request->validate([
            'submission_note' => 'required|string',
            'qa_values' => 'nullable|array',
        ]);

        if ($task->qa_form_id) {
            $form = \App\Models\QaForm::with('fields')->find($task->qa_form_id);
            if ($form) {
                $qaValues = $validated['qa_values'] ?? [];
                foreach ($form->fields as $field) {
                    if ($field->is_required && (!isset($qaValues[$field->id]) || $qaValues[$field->id] === '' || $qaValues[$field->id] === null)) {
                        return response()->json(['message' => "QA Field '{$field->label}' is required."], 422);
                    }
                }
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

        $task->update(['approval_id' => $approval->id]);

        TaskActivity::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'event' => 'submitted',
            'metadata' => ['note' => $validated['submission_note']],
        ]);

        if ($task->project_id) {
            $this->notifyProjectConversation($task, "📝 **Task Submitted for Review**: \"{$task->title}\" by " . $request->user()->name);
        }

        return response()->json($task->load(['approval', 'qaSubmission']));
    }

    public function addComment(Request $request, $id)
    {
        $task = Task::with(['assignees', 'project.members'])->findOrFail($id);

        if (!$this->userHasManage($request) && !$this->isTaskParticipant($task, $request->user()->id)) {
            return response()->json(['message' => 'Unauthorized access to task'], 403);
        }

        $validated = $request->validate([
            'body' => 'required|string',
        ]);

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        return response()->json($comment->load('user'));
    }

    public function destroy(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        if (!$this->userHasManage($request) && $task->reporter_id !== $request->user()->id) {
            return response()->json(['message' => 'You can only delete tasks you created.'], 403);
        }

        $task->delete();
        return response()->json(['message' => 'Task deleted successfully']);
    }

    public function approve(Request $request, $id)
    {
        $task = Task::with('approval')->findOrFail($id);
        
        if (!$task->approval) {
            return response()->json(['message' => 'Task has no pending approval.'], 422);
        }

        ApprovalService::approve($task->approval, $request->user()->id);

        TaskService::updateStatus($task, 'done', $request->user()->id);
        $task->update(['status' => 'done']);

        TaskActivity::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'event' => 'approved',
            'metadata' => [],
        ]);

        return response()->json($task->fresh(['approval']));
    }

    public function redo(Request $request, $id)
    {
        $task = Task::with('approval')->findOrFail($id);

        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        if (!$task->approval) {
            return response()->json(['message' => 'Task has no pending approval.'], 422);
        }

        ApprovalService::redo($task->approval, $request->user()->id, $validated['reason']);

        TaskService::updateStatus($task, 'in_progress', $request->user()->id);
        $task->update(['status' => 'in_progress']);

        TaskActivity::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'event' => 'redo',
            'metadata' => ['reason' => $validated['reason']],
        ]);

        return response()->json($task->fresh(['approval']));
    }

    public function submitted(Request $request)
    {
        // Reviewers (tasks.manage) see every submission in their queue;
        // everyone else sees only their own submitted work.
        $query = Task::with(['project', 'approval', 'assignee', 'reporter'])
            ->where('status', 'review')
            ->orderBy('submitted_at', 'desc');

        if (!$this->userHasManage($request)) {
            $userId = $request->user()->id;
            $query->where(function ($q) use ($userId) {
                $q->where('assignee_id', $userId)
                  ->orWhere('reporter_id', $userId)
                  ->orWhereHas('assignees', fn ($aq) => $aq->where('users.id', $userId));
            });
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
