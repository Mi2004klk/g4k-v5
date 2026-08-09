<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Designation;
use App\Services\AuditLogger;
use Spatie\SimpleExcel\SimpleExcelWriter;

class DesignationController extends Controller
{
    private function buildIndexQuery(Request $request)
    {
        $query = Designation::withCount('users');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        return $query;
    }

    public function index(Request $request)
    {
        $query = $this->buildIndexQuery($request);
        $designations = $query->orderBy('id', 'desc')->cursorPaginate(20);
        return response()->json($designations);
    }

    public function export(Request $request)
    {
        $query = $this->buildIndexQuery($request);
        $designations = $query->orderBy('id', 'desc')->get();

        return response()->streamDownload(function () use ($designations) {
            $writer = SimpleExcelWriter::streamDownload('designations.csv');
            foreach ($designations as $designation) {
                $writer->addRow([
                    'ID' => $designation->id,
                    'Name' => $designation->name,
                    'Description' => $designation->description,
                    'Members Count' => $designation->users_count ?? 0,
                    'Status' => $designation->is_active ? 'Active' : 'Inactive',
                    'Created At' => $designation->created_at->format('Y-m-d H:i:s'),
                ]);
            }
            $writer->close();
        }, 'designations.csv', ['Content-Type' => 'text/csv']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:designations,name',
            'description' => 'nullable|string',
        ]);

        $designation = Designation::create($validated);
        
        AuditLogger::log($request, 'create', 'designation', $designation->id, null, $designation->toArray());

        return response()->json($designation, 201);
    }

    public function show(string $id)
    {
        $designation = Designation::with('users')->findOrFail($id);
        return response()->json($designation);
    }

    public function update(Request $request, string $id)
    {
        $designation = Designation::findOrFail($id);
        $before = $designation->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:designations,name,' . $designation->id,
            'description' => 'nullable|string',
        ]);

        $designation->update($validated);
        
        AuditLogger::log($request, 'update', 'designation', $designation->id, $before, $designation->fresh()->toArray());

        return response()->json($designation);
    }

    public function updateStatus(Request $request, string $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $designation = Designation::findOrFail($id);
        $before = $designation->toArray();

        $designation->update(['is_active' => $validated['status'] === 'active']);
        
        AuditLogger::log($request, 'update_status', 'designation', $designation->id, $before, $designation->toArray());

        return response()->json($designation);
    }

    public function destroy(Request $request, string $id)
    {
        $designation = Designation::findOrFail($id);
        
        // In-use guard
        if ($designation->users()->exists()) {
            return response()->json(['message' => 'Cannot delete a designation that is currently assigned to employees.'], 422);
        }

        $before = $designation->toArray();
        $designation->delete();
        
        AuditLogger::log($request, 'delete', 'designation', $designation->id, $before, null);
        
        return response()->json(null, 204);
    }
}
