<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Department;
use App\Models\Team;

class DepartmentController extends Controller
{
    public function index()
    {
        return response()->json(Department::with('teams')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments,name',
            'description' => 'nullable|string',
        ]);

        $department = Department::create($validated);
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

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments,name,' . $department->id,
            'description' => 'nullable|string',
        ]);

        $department->update($validated);
        return response()->json($department);
    }

    public function destroy(string $id)
    {
        $department = Department::findOrFail($id);
        $department->delete();
        return response()->json(null, 204);
    }

    public function storeTeam(Request $request, string $departmentId)
    {
        $department = Department::findOrFail($departmentId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Check unique team name within department
        if ($department->teams()->where('name', $validated['name'])->exists()) {
            return response()->json(['message' => 'Team name already exists in this department.'], 422);
        }

        $team = $department->teams()->create($validated);
        return response()->json($team, 201);
    }

    public function destroyTeam(string $departmentId, string $teamId)
    {
        $team = Team::where('department_id', $departmentId)->findOrFail($teamId);
        $team->delete();
        return response()->json(null, 204);
    }
}
