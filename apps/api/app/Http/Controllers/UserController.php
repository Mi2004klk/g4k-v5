<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\RoleAssignment;
use Illuminate\Support\Facades\Hash;
use App\Services\AuditLogger;
use App\Services\AutoNumberingService;
use Spatie\SimpleExcel\SimpleExcelWriter;
use App\Services\CapabilityMatrix;

class UserController extends Controller
{
    private function hasCapability(Request $request, string $capability): bool
    {
        $token = $request->user()->currentAccessToken();
        $activeRole = $token ? ($token->abilities[0] ?? 'employee') : 'employee';
        $activeRole = str_replace('role:', '', $activeRole);
        return CapabilityMatrix::hasCapability($activeRole, $capability);
    }

    private function buildIndexQuery(Request $request)
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

        return $query;
    }

    public function index(Request $request)
    {
        $query = $this->buildIndexQuery($request);
        $users = $query->orderBy('id', 'desc')->cursorPaginate(20);
        return response()->json($users);
    }

    public function export(Request $request)
    {
        $query = $this->buildIndexQuery($request);
        $users = $query->orderBy('id', 'desc')->get();

        return response()->streamDownload(function () use ($users) {
            $writer = SimpleExcelWriter::streamDownload('users.csv');
            foreach ($users as $user) {
                $roles = $user->roleAssignments->pluck('role')->implode(', ');
                $writer->addRow([
                    'ID' => $user->id,
                    'Name' => $user->name,
                    'Email' => $user->email,
                    'Employee ID' => $user->employee_id,
                    'Phone' => $user->phone,
                    'Department' => $user->department->name ?? 'N/A',
                    'Designation' => $user->designation->name ?? 'N/A',
                    'Roles' => $roles,
                    'Status' => $user->status,
                    'Created At' => $user->created_at->format('Y-m-d H:i:s'),
                ]);
            }
            $writer->close();
        }, 'users.csv', ['Content-Type' => 'text/csv']);
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

        $roles = $validated['roles'];
        $isCreatingHR = in_array('hr', $roles) || in_array('super_admin', $roles);
        $isCreatingEmployee = in_array('employee', $roles);

        if ($isCreatingHR && !$this->hasCapability($request, 'users.hr.manage')) {
            return response()->json(['message' => 'Unauthorized to create HR/Admin users.'], 403);
        }

        if ($isCreatingEmployee && !$this->hasCapability($request, 'users.employee.manage')) {
            return response()->json(['message' => 'Unauthorized to create Employee users.'], 403);
        }

        if (!$isCreatingHR && !$isCreatingEmployee) {
            return response()->json(['message' => 'Invalid roles specified.'], 422);
        }

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

        foreach ($roles as $roleName) {
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
            'roles' => 'sometimes|array|min:1',
            'roles.*' => 'string',
        ]);

        // Access check for updating roles
        if (isset($validated['roles'])) {
            $roles = $validated['roles'];
            $isHR = in_array('hr', $roles) || in_array('super_admin', $roles);
            $isEmployee = in_array('employee', $roles);
            if ($isHR && !$this->hasCapability($request, 'users.hr.manage')) {
                return response()->json(['message' => 'Unauthorized to assign HR/Admin roles.'], 403);
            }
            if ($isEmployee && !$this->hasCapability($request, 'users.employee.manage')) {
                return response()->json(['message' => 'Unauthorized to assign Employee roles.'], 403);
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

    public function updateStatus(Request $request, string $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $user = User::findOrFail($id);
        
        // Capability Check
        $targetRoles = $user->roleAssignments->pluck('role')->toArray();
        $isHRTarget = in_array('hr', $targetRoles) || in_array('super_admin', $targetRoles);
        if ($isHRTarget && !$this->hasCapability($request, 'users.hr.manage')) {
            return response()->json(['message' => 'Unauthorized to manage HR/Admin users.'], 403);
        }
        if (!$isHRTarget && !$this->hasCapability($request, 'users.employee.manage')) {
            return response()->json(['message' => 'Unauthorized to manage Employee users.'], 403);
        }

        $before = $user->toArray();

        if ($validated['status'] === 'inactive') {
            $isSuperAdmin = RoleAssignment::where('user_id', $user->id)->where('role', 'super_admin')->exists();
            if ($isSuperAdmin) {
                $activeSuperAdminCount = User::where('status', 'active')
                    ->whereHas('roleAssignments', function ($q) {
                        $q->where('role', 'super_admin');
                    })->count();

                if ($activeSuperAdminCount <= 1 && $user->status === 'active') {
                    return response()->json(['message' => 'Cannot deactivate the last active Super Admin.'], 422);
                }
            }
        }

        $user->update(['status' => $validated['status']]);
        AuditLogger::log($request, 'update_status', 'user', $user->id, $before, $user->toArray());

        return response()->json($user);
    }

    public function destroy(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        // Capability Check
        $targetRoles = $user->roleAssignments->pluck('role')->toArray();
        $isHRTarget = in_array('hr', $targetRoles) || in_array('super_admin', $targetRoles);
        if ($isHRTarget && !$this->hasCapability($request, 'users.hr.manage')) {
            return response()->json(['message' => 'Unauthorized to manage HR/Admin users.'], 403);
        }
        if (!$isHRTarget && !$this->hasCapability($request, 'users.employee.manage')) {
            return response()->json(['message' => 'Unauthorized to manage Employee users.'], 403);
        }

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

    public function activity(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        
        // Ensure user can view this activity
        $isSelf = $request->user()->id === $user->id;
        $canViewAny = $this->hasCapability($request, 'users.hr.manage');
        $canViewEmployee = $this->hasCapability($request, 'users.employee.manage');
        
        if (!$isSelf && !$canViewAny && !$canViewEmployee) {
            return response()->json(['message' => 'Unauthorized to view this user\'s activity.'], 403);
        }

        // We fetch logs WHERE user_id = $id (actions performed by this user) OR where target = user and target_id = $id (actions affecting this user)
        // Usually, activity logs for a user means what they did.
        $logs = \Illuminate\Support\Facades\DB::table('audit_logs')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->cursorPaginate(20);

        return response()->json($logs);
    }

    public function resetPassword(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        
        // Capability Check
        $targetRoles = $user->roleAssignments->pluck('role')->toArray();
        $isHRTarget = in_array('hr', $targetRoles) || in_array('super_admin', $targetRoles);
        if ($isHRTarget && !$this->hasCapability($request, 'users.hr.manage')) {
            return response()->json(['message' => 'Unauthorized to manage HR/Admin users.'], 403);
        }
        if (!$isHRTarget && !$this->hasCapability($request, 'users.employee.manage')) {
            return response()->json(['message' => 'Unauthorized to manage Employee users.'], 403);
        }

        $user->password = Hash::make('Password123!');
        $user->must_change_password = true;
        $user->save();

        AuditLogger::log($request, 'reset_password', 'user', $user->id, null, ['status' => 'password_reset']);

        return response()->json(['message' => 'Password reset to default (Password123!)']);
    }

    public function bulk(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id',
            'action' => 'required|in:activate,deactivate'
        ]);

        $users = User::whereIn('id', $validated['ids'])->get();
        $status = $validated['action'] === 'activate' ? 'active' : 'inactive';
        
        $canManageHR = $this->hasCapability($request, 'users.hr.manage');
        $canManageEmployee = $this->hasCapability($request, 'users.employee.manage');

        foreach ($users as $user) {
            $targetRoles = $user->roleAssignments->pluck('role')->toArray();
            $isHRTarget = in_array('hr', $targetRoles) || in_array('super_admin', $targetRoles);
            
            if ($isHRTarget && !$canManageHR) {
                continue; // Skip unauthorized
            }
            if (!$isHRTarget && !$canManageEmployee) {
                continue; // Skip unauthorized
            }

            // Super Admin check for deactivate
            if ($status === 'inactive' && in_array('super_admin', $targetRoles)) {
                $activeSuperAdminCount = User::where('status', 'active')
                    ->whereHas('roleAssignments', function ($q) {
                        $q->where('role', 'super_admin');
                    })->count();

                if ($activeSuperAdminCount <= 1 && $user->status === 'active') {
                    continue; // Skip last super admin
                }
            }

            $before = $user->toArray();
            $user->update(['status' => $status]);
            AuditLogger::log($request, "bulk_{$status}", 'user', $user->id, $before, $user->toArray());
        }

        return response()->json(['message' => 'Bulk action completed.']);
    }
}
