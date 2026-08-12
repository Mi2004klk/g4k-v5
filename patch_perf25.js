const fs = require('fs');

function patchControllerExport(file, listVarName) {
    let code = fs.readFileSync(file, 'utf8');
    // Replace DB::table('role_assignments')->...->pluck('role')->toArray()
    code = code.replace(/DB::table\('role_assignments'\)->where\('user_id', \$user->id\)->pluck\('role'\)->toArray\(\)/g, '$user->getCachedRoles()');

    if (code.includes('->streamDownload')) {
        code = code.replace(new RegExp(`\\$${listVarName} = \\$query->(orderBy\\(.*?\\)->)?get\\(\\);`, 'g'), `// get() removed for streaming`);
        code = code.replace(new RegExp(`use \\(\\$${listVarName}\\)`, 'g'), 'use ($query)');
        
        // Find foreach ($listVar as $item)
        // Usually: foreach ($departments as $department) or similar
        const foreachRegex = new RegExp(`foreach \\(\\$${listVarName} as \\$(\\w+)\\)`, 'g');
        const match = [...code.matchAll(foreachRegex)][0];
        
        if (match) {
            code = code.replace(foreachRegex, `foreach ($query->cursor() as $${match[1]})`);
        }
    }
    
    fs.writeFileSync(file, code);
}

patchControllerExport('apps/api/app/Http/Controllers/LeaveRequestController.php', 'leaves');
patchControllerExport('apps/api/app/Http/Controllers/DesignationController.php', 'designations');
patchControllerExport('apps/api/app/Http/Controllers/DepartmentController.php', 'departments');

let attCode = fs.readFileSync('apps/api/app/Http/Controllers/AttendanceController.php', 'utf8');
attCode = attCode.replace(/\$records = \$query->orderBy\('date', 'desc'\)->get\(\);/g, '// $records = $query->get() removed for streaming');
attCode = attCode.replace(/use \(\$records\)/g, 'use ($query)');
attCode = attCode.replace(/foreach \(\$records as \$record\)/g, "foreach ($query->orderBy('date', 'desc')->cursor() as $record)");
fs.writeFileSync('apps/api/app/Http/Controllers/AttendanceController.php', attCode);

let asCode = fs.readFileSync('apps/api/app/Services/ApprovalService.php', 'utf8');
asCode = asCode.replace(/DB::table\('role_assignments'\)->where\('user_id', \$user->id\)->pluck\('role'\)->toArray\(\)/g, '$user->getCachedRoles()');
fs.writeFileSync('apps/api/app/Services/ApprovalService.php', asCode);

console.log('Patched PERF-2 and PERF-5 cross module controllers');
