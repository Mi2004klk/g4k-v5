<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Department;
use App\Models\Team;
use App\Services\AuditLogger;
use Spatie\SimpleExcel\SimpleExcelWriter;
use App\Presenters\UserPresenter;

class DepartmentController extends Controller
{
    private function buildIndexQuery(Request $request)
    {
        $query = Department::withCount('users')->with('teams');
        if (!$request->boolean('directory_view')) {
            \App\Support\HrScope::apply($query, $request->user(), 'id');
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'archived') {
                $query->onlyTrashed();
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        return $query;
    }

    public function index(Request $request)
    {
        $query = $this->buildIndexQuery($request);
        $request->validate(['per_page' => 'nullable|integer|in:20,50,100,1000']);
        $perPage = $request->input('per_page', 20);
        $departments = $query->orderBy('id', 'desc')->paginate($perPage);
        return response()->json($departments);
    }

    public function teams(string $id)
    {
        $department = Department::withTrashed()->findOrFail($id);
        return response()->json($department->teams);
    }

    public function export(Request $request)
    {
        $job = \App\Models\ExportJob::create([
            'user_id' => $request->user()->id,
            'report_key' => 'departments',
            'format' => $request->input('format', 'xlsx'),
            'status' => 'pending',
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
            ],
        ]);

        dispatch(new \App\Jobs\GenerateReportJob($job));

        return response()->json([
            'message' => 'Export started. You will be notified when it is ready.',
            'job_id' => $job->id,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments,name',
            'description' => 'nullable|string',
        ]);

        $department = Department::create($validated);
        
        AuditLogger::log($request, 'create', 'department', $department->id, null, $department->toArray());

        return response()->json($department, 201);
    }

    public function show(Request $request, string $id)
    {
        $department = Department::withTrashed()->with(['teams', 'users', 'users.designation', 'hrs'])->findOrFail($id);
        
        UserPresenter::applyPrivacyFilter($department->users, $request);
        UserPresenter::applyPrivacyFilter($department->hrs, $request);

        return response()->json($department);
    }

    public function update(Request $request, string $id)
    {
        $department = Department::withTrashed()->findOrFail($id);
        $before = $department->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments,name,' . $department->id,
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $department->update($validated);
        
        AuditLogger::log($request, 'update', 'department', $department->id, $before, $department->fresh()->toArray());

        return response()->json($department);
    }

    public function archive(Request $request, string $id)
    {
        $department = Department::withTrashed()->findOrFail($id);
        
        if ($department->users()->exists()) {
            return response()->json([
                'message' => 'Cannot archive department because it has assigned employees.'
            ], 422);
        }

        $before = $department->toArray();

        $department->update([
            'archived_at' => now(),
            'is_active' => false
        ]);
        $department->delete();

        AuditLogger::log($request, 'archive', 'department', $department->id, $before, $department->toArray());

        return response()->json($department);
    }

    public function restore(Request $request, string $id)
    {
        $department = Department::withTrashed()->findOrFail($id);
        $before = $department->toArray();

        $department->restore();
        $department->update([
            'is_active' => true,
            'archived_at' => null
        ]);

        AuditLogger::log($request, 'restore', 'department', $department->id, $before, $department->toArray());

        return response()->json($department);
    }

    public function destroy(Request $request, string $id)
    {
        $department = Department::withTrashed()->findOrFail($id);
        
        $before = $department->toArray();

        // In-use guard: block deletion/deactivation if employees exist
        if ($department->users()->exists()) {
            return response()->json([
                'message' => 'Cannot delete department because it has assigned employees.'
            ], 422);
        }

        $department->delete();
        
        AuditLogger::log($request, 'delete', 'department', $department->id, $before, null);
        
        return response()->json(null, 204);
    }

    public function storeTeam(Request $request, string $departmentId)
    {
        $department = Department::withTrashed()->findOrFail($departmentId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($department->teams()->where('name', $validated['name'])->exists()) {
            return response()->json(['message' => 'Team name already exists in this department.'], 422);
        }

        $team = $department->teams()->create($validated);
        AuditLogger::log($request, 'create', 'team', $team->id, null, $team->toArray());

        return response()->json($team, 201);
    }

    public function updateTeam(Request $request, string $departmentId, string $teamId)
    {
        $team = Team::where('department_id', $departmentId)->findOrFail($teamId);
        $before = $team->toArray();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        
        $team->update($validated);
        AuditLogger::log($request, 'update', 'team', $team->id, $before, $team->toArray());

        return response()->json($team);
    }

    public function destroyTeam(Request $request, string $departmentId, string $teamId)
    {
        $team = Team::where('department_id', $departmentId)->findOrFail($teamId);
        $before = $team->toArray();
        \App\Models\User::where('team_id', $team->id)->update(['team_id' => null]);
        $team->delete();
        
        AuditLogger::log($request, 'delete', 'team', $team->id, $before, null);
        
        return response()->json(null, 204);
    }

    public function syncHrs(Request $request, string $id)
    {
        $department = Department::withTrashed()->findOrFail($id);
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);
        
        $invalidUsers = \App\Models\User::whereIn('id', $validated['user_ids'])
            ->whereDoesntHave('roleAssignments', function ($q) {
                $q->whereIn('role', ['hr', 'super_admin']);
            })->exists();

        if ($invalidUsers) {
            return response()->json(['message' => 'One or more users do not have HR/Admin roles.'], 422);
        }

        $department->hrs()->sync($validated['user_ids']);
        AuditLogger::log($request, 'update', 'department_hrs', $department->id, null, ['user_ids' => $validated['user_ids']]);
        
        return response()->json(['message' => 'HR roster updated successfully.']);
    }

    public function addHr(Request $request, string $id, string $userId)
    {
        $department = Department::withTrashed()->findOrFail($id);
        
        $user = \App\Models\User::findOrFail($userId);
        if (!$user->roleAssignments()->whereIn('role', ['hr', 'super_admin'])->exists()) {
            return response()->json(['message' => 'User does not have an HR/Admin role.'], 422);
        }

        $department->hrs()->syncWithoutDetaching([$userId]);
        AuditLogger::log($request, 'create', 'department_hr', $department->id, null, ['user_id' => $userId]);
        return response()->json(['message' => 'HR added successfully.']);
    }

    public function removeHr(Request $request, string $id, string $userId)
    {
        $department = Department::withTrashed()->findOrFail($id);
        $department->hrs()->detach($userId);
        AuditLogger::log($request, 'delete', 'department_hr', $department->id, ['user_id' => $userId], null);
        return response()->json(['message' => 'HR removed successfully.']);
    }

    public function syncEmployees(Request $request, string $id)
    {
        $department = Department::withTrashed()->findOrFail($id);
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        \App\Models\User::whereIn('id', $validated['user_ids'])->update(['department_id' => $department->id]);
        AuditLogger::log($request, 'update', 'department_employees', $department->id, null, ['user_ids' => $validated['user_ids']]);

        return response()->json(['message' => 'Employees assigned successfully.']);
    }

    public function removeEmployee(Request $request, string $id, string $userId)
    {
        $department = Department::withTrashed()->findOrFail($id);
        $user = \App\Models\User::where('department_id', $department->id)->findOrFail($userId);
        $user->update(['department_id' => null]);
        
        AuditLogger::log($request, 'delete', 'department_employee', $department->id, ['user_id' => $userId], null);
        
        return response()->json(['message' => 'Employee removed from department successfully.']);
    }
}
