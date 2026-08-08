<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Designation;

class DesignationController extends Controller
{
    public function index()
    {
        return response()->json(Designation::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:designations,name',
            'description' => 'nullable|string',
        ]);

        $designation = Designation::create($validated);
        return response()->json($designation, 201);
    }

    public function update(Request $request, string $id)
    {
        $designation = Designation::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:designations,name,' . $designation->id,
            'description' => 'nullable|string',
        ]);

        $designation->update($validated);
        return response()->json($designation);
    }

    public function destroy(string $id)
    {
        $designation = Designation::findOrFail($id);
        $designation->delete();
        return response()->json(null, 204);
    }
}
