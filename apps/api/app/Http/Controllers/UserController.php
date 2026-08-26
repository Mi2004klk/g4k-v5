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
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;

class UserController extends Controller
{
    private function hasCapability(Request $request, string $capability): bool
    {
        $activeRole = $request->user()->resolveActiveRole();
        return CapabilityMatrix::hasCapability($activeRole, $capability);
    }

    private function checkHrScope(Request $request, User $targetUser): bool
    {
        $activeRole = $request->user()->resolveActiveRole();
        if ($activeRole === 'super_admin') {
            return true;
        }
        if ($activeRole === 'employee') {
            return (int) $request->user()->id === (int) $targetUser->id;
        }
        
        return \App\Support\HrScope::apply(User::where('id', $targetUser->id), $request->user())->exists();
    }

    private function buildIndexQuery(Request $request)
    {
        $query = User::with(['department', 'team', 'designation', 'roleAssignments']);
        
        $isHR = $this->hasCapability($request, 'users.employee.manage');
        $isSuperAdmin = $request->user()->resolveActiveRole() === 'super_admin';
        
        if ($isHR && !$isSuperAdmin) {
            \App\Support\HrScope::apply($query, $request->user());
        }

        $query->when($request->boolean('only_trashed'), fn($q) => $q->onlyTrashed());

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
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
        $request->validate([
            'per_page' => 'nullable|integer|in:20,50,100'
        ]);

        $query = $this->buildIndexQuery($request);
        $perPage = $request->input('per_page', 20);
        $users = $query->orderBy('id', 'desc')->paginate($perPage);
        
        $users->getCollection()->transform(function ($user) {
            return $user->makeHidden(['blood_group', 'emergency_contact', 'alternate_mobile', 'preferences']);
        });

        return response()->json($users);
    }

    public function export(Request $request)
    {
        $job = \App\Models\ExportJob::create([
            'user_id' => $request->user()->id,
            'report_key' => 'users',
            'format' => $request->input('format', 'xlsx'),
            'status' => 'pending',
            'filters' => [
                'only_trashed' => $request->boolean('only_trashed'),
                'search' => $request->input('search'),
                'department_id' => $request->input('department_id'),
                'status' => $request->input('status'),
                'role' => $request->input('role'),
                'ids' => $request->input('ids'),
                '_has_manage' => $this->hasCapability($request, 'users.employee.manage') || $request->user()->roleAssignments->pluck('role')->contains('super_admin'),
                '_user_id' => $request->user()->id,
            ],
        ]);

        dispatch(new \App\Jobs\GenerateReportJob($job));

        return response()->json([
            'message' => 'Export started. You will be notified when it is ready.',
            'job_id' => $job->id,
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

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

        $forceChange = \App\Models\Setting::where('category', 'security')->where('key', 'force_password_change')->value('value');
        $mustChange = filter_var($forceChange, FILTER_VALIDATE_BOOLEAN);

        $password = \Illuminate\Support\Str::random(12);

        $user = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $employeeCode, $mustChange, $roles, $password) {
            $user = User::forceCreate([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'username' => $validated['username'] ?? null,
                'employee_id' => $validated['employee_id'] ?? $employeeCode,
                'phone' => $validated['phone'] ?? null,
                'department_id' => $validated['department_id'] ?? null,
                'team_id' => $validated['team_id'] ?? null,
                'designation_id' => $validated['designation_id'] ?? null,
                'password' => Hash::make($password),
                'must_change_password' => $mustChange,
                'password_changed_at' => now(),
                'status' => 'active',
                'emergency_contact' => json_encode([
                    'name' => $validated['emergency_contact_name'] ?? null,
                    'phone' => $validated['emergency_contact_phone'] ?? null,
                    'relation' => $validated['emergency_contact_relation'] ?? null,
                ]),
            ]);

            foreach ($roles as $roleName) {
                $user->roleAssignments()->create(['role' => $roleName]);
            }
            return $user;
        });
        \Illuminate\Support\Facades\Cache::forget("user_{$user->id}_roles");

        $user->load(['department', 'team', 'designation', 'roleAssignments']);
        AuditLogger::log($request, 'create', 'user', $user->id, null, $user->toArray());

        $emailSent = false;
        if (\App\Support\SmtpSettings::isConfigured()) {
            try {
                \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\UserCredentialsMail($user, $password));
                $emailSent = true;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send credentials: ' . $e->getMessage());
            }
        }

        $responseData = $user->toArray();
        if (!$emailSent) {
            $responseData['_temp_password'] = $password;
            $responseData['_warning'] = 'SMTP is not configured or failed to send email. Please securely share this temporary password with the user.';
        }

        return response()->json($responseData, 201);
    }

    public function update(UpdateUserRequest $request, string $id)
    {
        $user = User::findOrFail($id);
        if (!$this->checkHrScope($request, $user)) {
            return response()->json(['message' => 'Unauthorized to update this user.'], 403);
        }
        $before = $user->toArray();

        $validated = $request->validated();

        $targetHasHR = $user->roleAssignments->pluck('role')->contains('hr');
        $isTargetSuperAdmin = $user->roleAssignments->pluck('role')->contains('super_admin');
        
        if ($isTargetSuperAdmin && $request->user()->resolveActiveRole() !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized to update Super Admin users.'], 403);
        }

        if ($targetHasHR && !$this->hasCapability($request, 'users.hr.manage')) {
            return response()->json(['message' => 'Unauthorized to update HR users.'], 403);
        }

        if (isset($validated['roles'])) {
            $roles = $validated['roles'];
            $isHR = in_array('hr', $roles);
            $isSuperAdmin = in_array('super_admin', $roles);
            $isEmployee = in_array('employee', $roles);

            if ($isSuperAdmin && $request->user()->resolveActiveRole() !== 'super_admin') {
                return response()->json(['message' => 'Unauthorized to assign Super Admin role. Only a Super Admin can do this.'], 403);
            }
            if ($isHR && !$this->hasCapability($request, 'users.hr.manage')) {
                return response()->json(['message' => 'Unauthorized to assign HR role.'], 403);
            }
            if ($isEmployee && !$this->hasCapability($request, 'users.employee.manage')) {
                return response()->json(['message' => 'Unauthorized to assign Employee role.'], 403);
            }
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($user, $validated) {
            $updateData = [];
            $fields = ['name', 'email', 'username', 'employee_id', 'phone', 'department_id', 'team_id', 'designation_id', 'work_schedule_id'];
            foreach ($fields as $field) {
                if (array_key_exists($field, $validated)) {
                    $updateData[$field] = $validated[$field];
                }
            }
            
            if (array_key_exists('emergency_contact_name', $validated) || array_key_exists('emergency_contact_phone', $validated) || array_key_exists('emergency_contact_relation', $validated)) {
                $emergencyContact = json_decode($user->emergency_contact, true) ?? [];
                if (array_key_exists('emergency_contact_name', $validated)) $emergencyContact['name'] = $validated['emergency_contact_name'];
                if (array_key_exists('emergency_contact_phone', $validated)) $emergencyContact['phone'] = $validated['emergency_contact_phone'];
                if (array_key_exists('emergency_contact_relation', $validated)) $emergencyContact['relation'] = $validated['emergency_contact_relation'];
                $updateData['emergency_contact'] = json_encode($emergencyContact);
            }

            if (!empty($updateData)) {
                $user->update($updateData);
            }

            if (isset($validated['roles']) && count($validated['roles']) > 0) {
                $user->roleAssignments()->delete();
                foreach ($validated['roles'] as $roleName) {
                    $user->roleAssignments()->create(['role' => $roleName]);
                }
                
                if (!in_array($user->active_role, $validated['roles'])) {
                    $user->update(['active_role' => null]);
                }
                
                $user->tokens()->delete();
                \Illuminate\Support\Facades\Cache::forget("user_{$user->id}_roles");
            }
        });
        
        if (isset($validated['roles']) && count($validated['roles']) > 0) {
            $user->forceFill(['active_role' => null])->save();
            $user->tokens()->delete();
            \Illuminate\Support\Facades\Cache::forget("user_{$user->id}_roles");
        }

        $user->load(['department', 'team', 'designation', 'roleAssignments']);
        AuditLogger::log($request, 'update', 'user', $user->id, $before, $user->toArray());

        return response()->json($user);
    }

    public function uploadAvatar(Request $request, string $id)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048', // 2MB max
        ]);

        $user = User::with('roleAssignments')->findOrFail($id);
        
        if (!$this->checkHrScope($request, $user)) {
            return response()->json(['message' => 'Unauthorized to update this user avatar.'], 403);
        }

        try {
            $disk = config('filesystems.default');
            $path = $request->file('avatar')->store("avatars/{$user->id}", $disk);

            if (!$path) {
                throw new \Exception('Failed to store file');
            }

            $oldAvatarUrl = $user->avatar_url;
            $avatarUrl = \Illuminate\Support\Facades\Storage::disk($disk)->url($path);

            $before = $user->toArray();
            $user->avatar_url = $avatarUrl;
            $user->save();

            if ($oldAvatarUrl) {
                try {
                    $oldBasename = basename(parse_url($oldAvatarUrl, PHP_URL_PATH));
                    \Illuminate\Support\Facades\Storage::disk($disk)->delete('avatars/' . $oldBasename);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to delete old avatar: ' . $e->getMessage());
                }
            }

            AuditLogger::log($request, 'upload_avatar', 'user', $user->id, $before, ['avatar_url' => $avatarUrl]);

            return response()->json([
                'url' => $avatarUrl,
                'path' => $path,
                'avatar_url' => $avatarUrl,
                'user' => $user->only(['id', 'name', 'avatar_url'])
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Avatar upload failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to upload avatar. Please check server storage permissions.'], 500);
        }
    }

    public function show(Request $request, string $id)
    {
        $userQuery = User::with(['department', 'team', 'designation', 'roleAssignments'])->where('id', $id);
        
        $isSelf = (int) $request->user()->id === (int) $id;
        
        if (!$isSelf) {
            \App\Support\HrScope::apply($userQuery, $request->user());
        }

        $user = $userQuery->firstOrFail();

        $canViewAny = $this->hasCapability($request, 'users.hr.manage');
        $canViewEmployee = $this->hasCapability($request, 'users.employee.manage');

        if (!$isSelf && !$canViewAny && !$canViewEmployee) {
            return response()->json(['message' => 'Unauthorized to view this user profile.'], 403);
        }

        return response()->json($user);
    }

    public function updateStatus(Request $request, string $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $user = User::with('roleAssignments')->findOrFail($id);
        if (!$this->checkHrScope($request, $user)) {
            return response()->json(['message' => 'Unauthorized to manage this user.'], 403);
        }
        
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

        $user->forceFill(['status' => $validated['status']])->save();
        if ($validated['status'] === 'inactive') {
            $user->tokens()->delete();
        }
        AuditLogger::log($request, 'update_status', 'user', $user->id, $before, $user->toArray());

        return response()->json($user);
    }

        public function restore(Request $request, string $id)
    {
        $user = User::with('roleAssignments')->withTrashed()->findOrFail($id);
        if (!$this->checkHrScope($request, $user)) {
            return response()->json(['message' => 'Unauthorized to manage this user.'], 403);
        }

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
        $user->restore();
        
        AuditLogger::log($request, 'restore', 'user', $user->id, $before, $user->toArray());
        
        return response()->json(['message' => 'User restored successfully.', 'user' => $user]);
    }

    public function destroy(Request $request, string $id)
    {
        $user = User::with('roleAssignments')->findOrFail($id);
        if (!$this->checkHrScope($request, $user)) {
            return response()->json(['message' => 'Unauthorized to manage this user.'], 403);
        }

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
        $avatarUrl = $user->avatar_url;
        $user->delete();
        
        if ($avatarUrl) {
            try {
                $basename = basename(parse_url($avatarUrl, PHP_URL_PATH));
                \Illuminate\Support\Facades\Storage::disk(config('filesystems.default'))->delete('avatars/' . $basename);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Failed to delete user avatar on destroy: ' . $e->getMessage());
            }
        }
        
        \Illuminate\Support\Facades\Cache::forget("user_{$user->id}");
        \Illuminate\Support\Facades\Cache::forget("user_{$user->id}_roles");
        $user->tokens()->delete();

        AuditLogger::log($request, 'delete', 'user', $user->id, $before, null);
        
        return response()->json(null, 204);
    }

    public function anonymize(Request $request, string $id)
    {
        $user = User::withTrashed()->findOrFail($id);
        
        if ($request->user()->resolveActiveRole() !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized. Only Super Admins can anonymize users.'], 403);
        }

        $isSuperAdmin = RoleAssignment::where('user_id', $user->id)->where('role', 'super_admin')->exists();
        if ($isSuperAdmin) {
            $superAdminCount = RoleAssignment::where('role', 'super_admin')->count();
            if ($superAdminCount <= 1) {
                return response()->json(['message' => 'Cannot anonymize the last Super Admin.'], 422);
            }
        }

        $before = $user->toArray();

        if ($user->avatar_url) {
            try {
                $basename = basename(parse_url($user->avatar_url, PHP_URL_PATH));
                \Illuminate\Support\Facades\Storage::disk(config('filesystems.default'))->delete('avatars/' . $basename);
            } catch (\Exception $e) {
                // Ignore missing file errors
            }
        }

        $user->forceFill([
            'name' => 'Anonymized User',
            'email' => 'deleted_' . $user->id . '@anonymized.local',
            'username' => null,
            'employee_id' => 'DEL-' . $user->id,
            'phone' => null,
            'alternate_mobile' => null,
            'emergency_contact' => null,
            'avatar_url' => null,
            'status' => 'inactive'
        ])->save();

        if (!$user->trashed()) {
            $user->delete();
        }

        \Illuminate\Support\Facades\Cache::forget("user_{$user->id}");
        \Illuminate\Support\Facades\Cache::forget("user_{$user->id}_roles");
        $user->tokens()->delete();

        AuditLogger::log($request, 'anonymize', 'user', $user->id, $before, $user->toArray());
        
        return response()->json(['message' => 'User anonymized successfully.', 'user' => $user]);
    }


    public function activity(Request $request, string $id)
    {
        $userQuery = User::where('id', $id);
        
        $isSelf = (int) $request->user()->id === (int) $id;
        
        if (!$isSelf) {
            \App\Support\HrScope::apply($userQuery, $request->user());
        }

        $user = $userQuery->firstOrFail();
        
        // Ensure user can view this activity
        $canViewAny = $this->hasCapability($request, 'users.hr.manage');
        $canViewEmployee = $this->hasCapability($request, 'users.employee.manage');
        
        if (!$isSelf && !$canViewAny && !$canViewEmployee) {
            return response()->json(['message' => 'Unauthorized to view this user\'s activity.'], 403);
        }

        // We fetch logs WHERE user_id = $id (actions performed by this user) OR where target = user and target_id = $id (actions affecting this user)
        // Usually, activity logs for a user means what they did.
        $logs = \Illuminate\Support\Facades\DB::table('audit_logs')
            ->select('audit_logs.*', 'audit_logs.ip as ip_address')
            ->where('user_id', $user->id)
            ->orderBy('at', 'desc')
            ->cursorPaginate(30);

        return response()->json($logs);
    }

    public function resetPassword(Request $request, string $id)
    {
        $user = User::with('roleAssignments')->findOrFail($id);
        if (!$this->checkHrScope($request, $user)) {
            return response()->json(['message' => 'Unauthorized to manage this user.'], 403);
        }
        
        // Capability Check
        $targetRoles = $user->roleAssignments->pluck('role')->toArray();
        $isHRTarget = in_array('hr', $targetRoles) || in_array('super_admin', $targetRoles);
        if ($isHRTarget && !$this->hasCapability($request, 'users.hr.manage')) {
            return response()->json(['message' => 'Unauthorized to manage HR/Admin users.'], 403);
        }
        if (!$isHRTarget && !$this->hasCapability($request, 'users.employee.manage')) {
            return response()->json(['message' => 'Unauthorized to manage Employee users.'], 403);
        }

        $tempPassword = \Illuminate\Support\Str::random(16);

        \Illuminate\Support\Facades\DB::transaction(function () use ($user, $tempPassword) {
            $user->password = Hash::make($tempPassword);
            $user->must_change_password = true;
            $user->password_changed_at = now();
            $user->save();
            $user->tokens()->delete();

            \Illuminate\Support\Facades\Cache::forget("user_{$user->id}");
        });

        $emailSent = false;
        if (\App\Support\SmtpSettings::isConfigured()) {
            try {
                \Illuminate\Support\Facades\Mail::raw("Your password has been reset by an administrator. Your temporary password is: {$tempPassword}\nPlease login and change it immediately.", function ($message) use ($user) {
                    $message->to($user->email)->subject('Password Reset by Administrator');
                });
                $emailSent = true;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Password reset email failed: ' . $e->getMessage());
            }
        }

        AuditLogger::log($request, 'reset_password', 'user', $user->id, [], ['notified' => $emailSent]);

        $responseData = ['message' => 'Password reset successfully.'];
        if (!$emailSent) {
            $responseData['_temp_password'] = $tempPassword;
            $responseData['_warning'] = 'SMTP is not configured or failed to send email. Please securely share this temporary password with the user.';
        } else {
            $responseData['message'] = 'Password reset and temporary password emailed to user.';
        }

        return response()->json($responseData);
    }

    public function bulk(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id,deleted_at,NULL',
            'action' => 'required|in:activate,deactivate'
        ]);

        $users = User::with('roleAssignments')->whereIn('id', $validated['ids'])->get();
        $status = $validated['action'] === 'activate' ? 'active' : 'inactive';
        
        $canManageHR = $this->hasCapability($request, 'users.hr.manage');
        $canManageEmployee = $this->hasCapability($request, 'users.employee.manage');

        $activeSuperAdminCount = null;
        if ($status === 'inactive') {
            $activeSuperAdminCount = User::where('status', 'active')
                ->whereHas('roleAssignments', function ($q) {
                    $q->where('role', 'super_admin');
                })->count();
        }

        $stats = [
            'success' => 0,
            'unauthorized' => 0,
            'skipped_super_admin' => 0,
            'skipped_same_status' => 0
        ];

        foreach ($users as $user) {
            $targetRoles = $user->roleAssignments->pluck('role')->toArray();
            $isHRTarget = in_array('hr', $targetRoles) || in_array('super_admin', $targetRoles);
            
            if ($isHRTarget && !$canManageHR) {
                $stats['unauthorized']++;
                continue; // Skip unauthorized
            }
            if (!$isHRTarget && !$canManageEmployee) {
                $stats['unauthorized']++;
                continue; // Skip unauthorized
            }
            
            if (!$this->checkHrScope($request, $user)) {
                $stats['unauthorized']++;
                continue;
            }

            // Super Admin check for deactivate
            if ($status === 'inactive' && in_array('super_admin', $targetRoles)) {
                if ($activeSuperAdminCount <= 1 && $user->status === 'active') {
                    $stats['skipped_super_admin']++;
                    continue; // Skip last super admin
                }
                if ($user->status === 'active') {
                    $activeSuperAdminCount--;
                }
            }

            if ($user->status === $status) {
                $stats['skipped_same_status']++;
                continue;
            }

            $before = $user->toArray();
            $user->forceFill(['status' => $status])->save();
            if ($status === 'inactive') {
                $user->tokens()->delete();
            }
            $stats['success']++;
            AuditLogger::log($request, "bulk_{$status}", 'user', $user->id, $before, $user->toArray());
        }

        return response()->json([
            'message' => "Bulk action completed.",
            'stats' => $stats
        ]);
    }

    public function leaveHistory(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        
        $canViewAny = $this->hasCapability($request, 'users.hr.manage');
        $canViewEmployee = $this->hasCapability($request, 'users.employee.manage');
        
        if (!$canViewAny && !$canViewEmployee) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        
        $isHR = $this->hasCapability($request, 'users.hr.manage');
        $isSuperAdmin = $request->user()->roleAssignments->pluck('role')->contains('super_admin');
        
        if ($isHR && !$isSuperAdmin && !\App\Support\HrScope::apply(User::where('id', $user->id), $request->user())->exists()) {
            return response()->json(['message' => 'Unauthorized to view this user.'], 403);
        }

        $leaves = \App\Models\LeaveRequest::with('approval')
            ->where('user_id', $id)
            ->orderBy('created_at', 'desc')
            ->cursorPaginate(20);

        return response()->json($leaves);
    }

    public function assignments(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        
        $canViewAny = $this->hasCapability($request, 'users.hr.manage');
        $canViewEmployee = $this->hasCapability($request, 'users.employee.manage');
        
        if (!$canViewAny && !$canViewEmployee) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        
        $isHR = $this->hasCapability($request, 'users.hr.manage');
        $isSuperAdmin = $request->user()->roleAssignments->pluck('role')->contains('super_admin');
        
        if ($isHR && !$isSuperAdmin && !\App\Support\HrScope::apply(User::where('id', $user->id), $request->user())->exists()) {
            return response()->json(['message' => 'Unauthorized to view this user.'], 403);
        }

        $projects = \App\Models\Project::whereHas('members', function($q) use ($id) {
            $q->where('user_id', $id);
        })->get();

        $tasks = \App\Models\Task::whereHas('assignees', function($q) use ($id) {
            $q->where('users.id', $id);
        })
            ->with('project')
            ->orderBy('status')
            ->get();

        return response()->json([
            'projects' => $projects,
            'tasks' => $tasks,
        ]);
    }
}

