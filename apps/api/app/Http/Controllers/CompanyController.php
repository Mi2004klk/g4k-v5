<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CompanyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(\App\Models\Company::paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'primary_phone' => 'nullable|string|max:50',
            'secondary_phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $company = \App\Models\Company::create($validated);
        return response()->json($company, 201);
    }

    public function show(string $id)
    {
        $company = \App\Models\Company::findOrFail($id);
        return response()->json($company);
    }

    public function update(Request $request, string $id)
    {
        $company = \App\Models\Company::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'short_name' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'primary_phone' => 'nullable|string|max:50',
            'secondary_phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $company->update($validated);
        return response()->json($company);
    }

    public function destroy(string $id)
    {
        $company = \App\Models\Company::findOrFail($id);
        $company->delete();
        return response()->json(['message' => 'Company deleted successfully']);
    }
}
