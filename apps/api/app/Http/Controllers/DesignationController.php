<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Designation;
use App\Services\AuditLogger;


class DesignationController extends Controller
{

    public function index(Request $request)
    {
        $designations = Designation::orderBy('id', 'desc')->cursorPaginate(20);
        return response()->json($designations);
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
        $designation = Designation::findOrFail($id);
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

    public function destroy(Request $request, string $id)
    {
        $designation = Designation::findOrFail($id);
        $before = $designation->toArray();
        $designation->delete();
        
        AuditLogger::log($request, 'delete', 'designation', $designation->id, $before, null);
        
        return response()->json(null, 204);
    }
}
