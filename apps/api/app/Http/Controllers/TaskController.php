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

class TaskController extends Controller
{
    private function userHasManage(Request $request): bool
    {
        $role = str_replace('role:', '', $request->user()->currentAccessToken()->abilities[0] ?? 'employee');
        return CapabilityMatrix::hasCapability($role, 'tasks.manage');
    }

    public function index(Request $request)
    {
        $query = Task::with(['project', 'assignee', 'reporter', 'blocker', 'qaForm']);

        if (!$this->userHasManage($request)) {
            $userId = $request->user()->id;
            $query->where(function ($q) use ($userId) {
                $q->where('assignee_id', $userId)
                  ->orWhere('reporter_id', $userId)
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

        $query->orderBy('created_at', 'desc');

        return response()->json($query->cursorPaginate(30));
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
            'assignee_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'parent_id' => 'nullable|exists:tasks,id',
            'blocked_by' => 'nullable|exists:tasks,id',
            'qa_form_id' => 'nullable|exists:qa_forms,id',
            'recurrence' => 'nullable|array',
        ]);

        if (!empty($validated['blocked_by']) && isset($validated['parent_id'])) {
            if (TaskService::hasDependencyCycle($validated['parent_id'], $validated['blocked_by'])) {
                return response()->json(['message' => 'Dependency cycle detected.'], 422);
            }
        }

        $task = Task::create(array_merge($validated, [
            'reporter_id' => $request->user()->id,
        ]));

        TaskActivity::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'event' => 'created',
            'metadata' => ['title' => $task->title],
        ]);

        return response()->json($task->load(['project', 'assignee', 'reporter', 'blocker', 'qaForm']));
    }

    public function show(Request $request, $id)
    {
        $task = Task::with(['project.members', 'assignee', 'reporter', 'blocker', 'qaForm', 'qaSubmission', 'comments.user', 'activities.user', 'timeLogs.user', 'approval'])->findOrFail($id);

        if (!$this->userHasManage($request)) {
            $userId = $request->user()->id;
            $isAllowed = $task->assignee_id === $userId || $task->reporter_id === $userId;

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
        $task = Task::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:todo,in_progress,review,done',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'assignee_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'progress' => 'sometimes|integer|min:0|max:100',
            'blocked_by' => 'nullable|exists:tasks,id',
            'qa_form_id' => 'nullable|exists:qa_forms,id',
            'recurrence' => 'nullable|array',
        ]);

        if (isset($validated['blocked_by']) && $validated['blocked_by'] !== null) {
            if (TaskService::hasDependencyCycle($task->id, $validated['blocked_by'])) {
                return response()->json(['message' => 'Dependency cycle detected.'], 422);
            }
        }

        if (isset($validated['status']) && $validated['status'] !== $task->status) {
            TaskService::updateStatus($task, $validated['status'], $request->user()->id);
            if ($validated['status'] === 'done') {
                RecurrenceService::handleCompletion($task);
            }
        }

        $task->update($validated);

        return response()->json($task->load(['project', 'assignee', 'reporter', 'blocker', 'qaForm']));
    }

    public function submitForReview(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        $validated = $request->validate([
            'submission_note' => 'required|string',
            'qa_values' => 'nullable|array',
        ]);

        // Require QA values if QA form is present
        if ($task->qa_form_id && empty($validated['qa_values'])) {
            return response()->json(['message' => 'QA Form values are required for this task.'], 422);
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

        return response()->json($task->load(['approval', 'qaSubmission']));
    }

    public function addComment(Request $request, $id)
    {
        $task = Task::findOrFail($id);

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

    public function destroy($id)
    {
        $task = Task::findOrFail($id);
        $task->delete();
        return response()->json(['message' => 'Task deleted successfully']);
    }
}
