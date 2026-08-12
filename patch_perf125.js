const fs = require('fs');

// PATCH User.php for PERF-2
let userCode = fs.readFileSync('apps/api/app/Models/User.php', 'utf8');
if (!userCode.includes('public function getCachedRoles()')) {
    const rolesMethod = `
    public function getCachedRoles()
    {
        return \\Illuminate\\Support\\Facades\\Cache::remember("user.{$this->id}.roles", 60, function () {
            return \\Illuminate\\Support\\Facades\\DB::table('role_assignments')
                ->where('user_id', $this->id)
                ->pluck('role')
                ->toArray();
        });
    }
`;
    userCode = userCode.replace(/}$/, rolesMethod + "}\n");
    fs.writeFileSync('apps/api/app/Models/User.php', userCode);
}

// PATCH UserController.php for PERF-1 and PERF-5
let ctlCode = fs.readFileSync('apps/api/app/Http/Controllers/UserController.php', 'utf8');

// PERF-1
ctlCode = ctlCode.replace(
    /User::whereIn\('id', \$validated\['ids'\]\)->get\(\);/g,
    "User::with('roleAssignments')->whereIn('id', $validated['ids'])->get();"
);

// PERF-5: Export streaming
ctlCode = ctlCode.replace(
    /\$users = \$query->orderBy\('id', 'desc'\)->get\(\);/g,
    "// $users = $query->orderBy('id', 'desc')->get(); removed to prevent OOM"
);
ctlCode = ctlCode.replace(
    /foreach \(\$users as \$user\)/g,
    "foreach ($query->orderBy('id', 'desc')->cursor() as $user)"
);
ctlCode = ctlCode.replace(
    /use \(\$users\)/g,
    "use ($query)"
);

// PERF-2 role clearing on update
ctlCode = ctlCode.replace(
    /\$user->roleAssignments\(\)->create\(\['role' => \$roleName\]\);\n\s+}/g,
    "$user->roleAssignments()->create(['role' => $roleName]);\n            }\n            \\Illuminate\\Support\\Facades\\Cache::forget(\"user.{$user->id}.roles\");"
);

fs.writeFileSync('apps/api/app/Http/Controllers/UserController.php', ctlCode);

console.log('Patched User.php and UserController.php');
