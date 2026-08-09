<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\RoleAssignment;
use Illuminate\Support\Facades\Hash;
use App\Services\AuditLogger;
use App\Services\AutoNumberingService;


class UserController extends Controller
{

    public function index(Request $request)
    {
        $query = User::with(['department', 'team', 'designation', 'roleAssignments']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->input('department_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('role')) {
            $role = $request->input('role');
            $query->whereHas('roleAssignments', function ($q) use ($role) {
                $q->where('role', $role);
            });
        }

        $users = $query->orderBy('id', 'desc')->cursorPaginate(20);
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'nullable|string|max:100|unique:users',
            'employee_id' => 'nullable|string|max:50|unique:users',
            'phone' => 'nullable|string|max:20',
            'department_id' => 'nullable|exists:departments,id',
            'team_id' => 'nullable|exists:teams,id',
            'designation_id' => 'nullable|exists:designations,id',
            'roles' => 'required|array|min:1',
            'roles.*' => 'string',
        ]);

        $employeeCode = AutoNumberingService::generateNext('employee');

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'] ?? null,
            'employee_id' => $validated['employee_id'] ?? $employeeCode,
            'employee_code' => $employeeCode,
            'phone' => $validated['phone'] ?? null,
            'department_id' => $validated['department_id'] ?? null,
            'team_id' => $validated['team_id'] ?? null,
            'designation_id' => $validated['designation_id'] ?? null,
            'password' => Hash::make('Password123!'),
            'must_change_password' => true,
            'status' => 'active',
        ]);

        foreach ($validated['roles'] as $roleName) {
            $user->roleAssignments()->create(['role' => $roleName]);
        }

        $user->load(['department', 'team', 'designation', 'roleAssignments']);
        AuditLogger::log($request, 'create', 'user', $user->id, null, $user->toArray());

        return response()->json($user, 201);
    }

    public function show(string $id)
    {
        $user = User::with(['department', 'team', 'designation', 'roleAssignments'])->findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        $before = $user->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'username' => 'nullable|string|max:100|unique:users,username,' . $user->id,
            'employee_id' => 'nullable|string|max:50|unique:users,employee_id,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'department_id' => 'nullable|exists:departments,id',
            'team_id' => 'nullable|exists:teams,id',
            'designation_id' => 'nullable|exists:designations,id',
            'status' => 'required|in:active,inactive',
            'roles' => 'sometimes|array|min:1',
            'roles.*' => 'string',
        ]);

        // Guard: Cannot deactivate the last Super Admin
        if ($validated['status'] === 'inactive') {
            $isSuperAdmin = RoleAssignment::where('user_id', $user->id)->where('role', 'super_admin')->exists();
            if ($isSuperAdmin) {
                $superAdminCount = RoleAssignment::where('role', 'super_admin')->count();
                if ($superAdminCount <= 1) {
                    return response()->json(['message' => 'Cannot deactivate the last Super Admin.'], 422);
                }
            }
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'] ?? $user->username,
            'employee_id' => $validated['employee_id'] ?? $user->employee_id,
            'phone' => $validated['phone'] ?? null,
            'department_id' => $validated['department_id'] ?? null,
            'team_id' => $validated['team_id'] ?? null,
            'designation_id' => $validated['designation_id'] ?? null,
            'status' => $validated['status'],
        ]);

        if (isset($validated['roles']) && count($validated['roles']) > 0) {
            $user->roleAssignments()->delete();
            foreach ($validated['roles'] as $roleName) {
                $user->roleAssignments()->create(['role' => $roleName]);
            }
        }

        $user->load(['department', 'team', 'designation', 'roleAssignments']);
        AuditLogger::log($request, 'update', 'user', $user->id, $before, $user->toArray());

        return response()->json($user);
    }

    public function destroy(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        // Guard: Cannot delete the last Super Admin
        $isSuperAdmin = RoleAssignment::where('user_id', $user->id)->where('role', 'super_admin')->exists();
        if ($isSuperAdmin) {
            $superAdminCount = RoleAssignment::where('role', 'super_admin')->count();
            if ($superAdminCount <= 1) {
                return response()->json(['message' => 'Cannot delete the last Super Admin.'], 422);
            }
        }

        $before = $user->toArray();
        $user->delete();
        
        AuditLogger::log($request, 'delete', 'user', $user->id, $before, null);
        
        return response()->json(null, 204);
    }

    public function resetPassword(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        $user->password = Hash::make('Password123!');
        $user->must_change_password = true;
        $user->save();

        AuditLogger::log($request, 'reset_password', 'user', $user->id, null, ['status' => 'password_reset']);

        return response()->json(['message' => 'Password reset to default (Password123!)']);
    }
}
