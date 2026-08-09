<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Department;
use App\Models\Team;
use App\Services\AuditLogger;

class DepartmentController extends Controller
{
    public function __construct()
    {
        $this->middleware('capability:departments.view')->only(['index', 'show']);
        $this->middleware('capability:departments.manage')->only(['store', 'update', 'destroy', 'storeTeam', 'destroyTeam']);
    }

    public function index(Request $request)
    {
        $departments = Department::with('teams')
            ->orderBy('id', 'desc')
            ->cursorPaginate(20);
            
        return response()->json($departments);
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

    public function show(string $id)
    {
        $department = Department::with('teams', 'users')->findOrFail($id);
        return response()->json($department);
    }

    public function update(Request $request, string $id)
    {
        $department = Department::findOrFail($id);
        $before = $department->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments,name,' . $department->id,
            'description' => 'nullable|string',
        ]);

        $department->update($validated);
        
        AuditLogger::log($request, 'update', 'department', $department->id, $before, $department->fresh()->toArray());

        return response()->json($department);
    }

    public function destroy(Request $request, string $id)
    {
        $department = Department::findOrFail($id);
        $before = $department->toArray();
        $department->delete();
        
        AuditLogger::log($request, 'delete', 'department', $department->id, $before, null);
        
        return response()->json(null, 204);
    }

    public function storeTeam(Request $request, string $departmentId)
    {
        $department = Department::findOrFail($departmentId);

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

    public function destroyTeam(Request $request, string $departmentId, string $teamId)
    {
        $team = Team::where('department_id', $departmentId)->findOrFail($teamId);
        $before = $team->toArray();
        $team->delete();
        
        AuditLogger::log($request, 'delete', 'team', $team->id, $before, null);
        
        return response()->json(null, 204);
    }
}
