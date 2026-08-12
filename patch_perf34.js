const fs = require('fs');

// PATCH DashboardController.php for PERF-3
let dashCode = fs.readFileSync('apps/api/app/Http/Controllers/DashboardController.php', 'utf8');

// Replace $deptUserIds = User::where('department_id', $deptId)->pluck('id');
// With query subquery logic
dashCode = dashCode.replace(
    /User::where\('department_id', \$deptId\)->pluck\('id'\);/g,
    "User::select('id')->where('department_id', $deptId);"
);

// $data['total_employees'] = $deptUserIds->count(); will work fine on Eloquent Builder
// $deptUserIds->count() is a query -> select count(*)

// whereIn('user_id', $deptUserIds) works flawlessly with Eloquent Builder

fs.writeFileSync('apps/api/app/Http/Controllers/DashboardController.php', dashCode);
console.log('Patched DashboardController.php for PERF-3');


// PATCH ChatController.php for PERF-4
let chatCode = fs.readFileSync('apps/api/app/Http/Controllers/ChatController.php', 'utf8');

// Replace ->get(); with ->cursorPaginate(50);
chatCode = chatCode.replace(
    /->get\(\);/g,
    "->cursorPaginate(50);"
);

fs.writeFileSync('apps/api/app/Http/Controllers/ChatController.php', chatCode);
console.log('Patched ChatController.php for PERF-4');
