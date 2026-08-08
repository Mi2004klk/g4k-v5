<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        // Load with relations for the list
        $users = User::with(['department', 'team', 'designation', 'roleAssignments'])->get();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'department_id' => 'nullable|exists:departments,id',
            'team_id' => 'nullable|exists:teams,id',
            'designation_id' => 'nullable|exists:designations,id',
            'roles' => 'required|array', // e.g., ['employee']
            'roles.*' => 'string',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'department_id' => $validated['department_id'] ?? null,
            'team_id' => $validated['team_id'] ?? null,
            'designation_id' => $validated['designation_id'] ?? null,
            'password' => Hash::make('Password123!'), // Default password
            'must_change_password' => true,
        ]);

        foreach ($validated['roles'] as $roleName) {
            $user->roleAssignments()->create(['role' => $roleName]);
        }

        return response()->json($user->load(['department', 'team', 'designation', 'roleAssignments']), 201);
    }

    public function show(string $id)
    {
        $user = User::with(['department', 'team', 'designation', 'roleAssignments'])->findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'department_id' => 'nullable|exists:departments,id',
            'team_id' => 'nullable|exists:teams,id',
            'designation_id' => 'nullable|exists:designations,id',
            'status' => 'required|in:active,inactive',
            'roles' => 'sometimes|array',
            'roles.*' => 'string',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'department_id' => $validated['department_id'] ?? null,
            'team_id' => $validated['team_id'] ?? null,
            'designation_id' => $validated['designation_id'] ?? null,
            'status' => $validated['status'],
        ]);

        if (isset($validated['roles'])) {
            $user->roleAssignments()->delete();
            foreach ($validated['roles'] as $roleName) {
                $user->roleAssignments()->create(['role' => $roleName]);
            }
        }

        return response()->json($user->load(['department', 'team', 'designation', 'roleAssignments']));
    }

    public function destroy(string $id)
    {
        $user = User::findOrFail($id);
        // We might want to just deactivate, but standard destroy is delete.
        $user->delete();
        return response()->json(null, 204);
    }
}
