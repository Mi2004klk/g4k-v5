<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Department;
use App\Models\Team;
use App\Services\AuditLogger;
use Spatie\SimpleExcel\SimpleExcelWriter;

class DepartmentController extends Controller
{
    private function buildIndexQuery(Request $request)
    {
        $query = Department::withCount('users')->with('teams');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'archived') {
                $query->whereNotNull('archived_at');
            } elseif ($status === 'inactive') {
                $query->where('is_active', false)->whereNull('archived_at');
            }
        }

        return $query;
    }

    public function index(Request $request)
    {
        $query = $this->buildIndexQuery($request);
        $departments = $query->orderBy('id', 'desc')->cursorPaginate(20);
        return response()->json($departments);
    }

    public function export(Request $request)
    {
        $query = $this->buildIndexQuery($request);
        $departments = $query->orderBy('id', 'desc')->get();

        return response()->streamDownload(function () use ($departments) {
            $writer = SimpleExcelWriter::streamDownload('departments.csv');
            foreach ($departments as $department) {
                $writer->addRow([
                    'ID' => $department->id,
                    'Name' => $department->name,
                    'Description' => $department->description,
                    'Members Count' => $department->users_count ?? 0,
                    'Is Active' => $department->is_active ? 'Yes' : 'No',
                    'Archived At' => $department->archived_at ? $department->archived_at->format('Y-m-d H:i:s') : 'N/A',
                    'Created At' => $department->created_at->format('Y-m-d H:i:s'),
                ]);
            }
            $writer->close();
        }, 'departments.csv', ['Content-Type' => 'text/csv']);
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
        $department = Department::with(['teams', 'users', 'users.designation'])->findOrFail($id);
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

    public function archive(Request $request, string $id)
    {
        $department = Department::findOrFail($id);
        $before = $department->toArray();

        $department->update([
            'is_active' => false,
            'archived_at' => now(),
        ]);

        AuditLogger::log($request, 'archive', 'department', $department->id, $before, $department->toArray());

        return response()->json($department);
    }

    public function restore(Request $request, string $id)
    {
        $department = Department::findOrFail($id);
        $before = $department->toArray();

        $department->update([
            'is_active' => true,
            'archived_at' => null,
        ]);

        AuditLogger::log($request, 'restore', 'department', $department->id, $before, $department->toArray());

        return response()->json($department);
    }

    public function destroy(Request $request, string $id)
    {
        $department = Department::findOrFail($id);
        
        // In-use guard for hard delete
        if ($department->users()->exists()) {
            return response()->json(['message' => 'Cannot delete a department with assigned employees.'], 422);
        }

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
