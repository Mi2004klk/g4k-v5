const fs = require('fs');

// api.php
let apiCode = fs.readFileSync('apps/api/routes/api.php', 'utf8');

if (!apiCode.includes('/users/{id}/restore')) {
    apiCode = apiCode.replace(
        "Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);",
        "Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);\n        Route::patch('/users/{id}/restore', [UserController::class, 'restore']);"
    );
    fs.writeFileSync('apps/api/routes/api.php', apiCode);
    console.log('Patched api.php');
}

// UserController.php
let ctlCode = fs.readFileSync('apps/api/app/Http/Controllers/UserController.php', 'utf8');

if (!ctlCode.includes('public function restore')) {
    const restoreMethod = `    public function restore(Request $request, string $id)
    {
        $user = User::withTrashed()->findOrFail($id);

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
`;

    ctlCode = ctlCode.replace('public function destroy(Request $request, string $id)', restoreMethod + '\n    public function destroy(Request $request, string $id)');
    fs.writeFileSync('apps/api/app/Http/Controllers/UserController.php', ctlCode);
    console.log('Patched UserController.php');
}
