const fs = require('fs');

let ctlCode = fs.readFileSync('apps/api/app/Http/Controllers/UserController.php', 'utf8');

// DB-3: Remove employee_code references
ctlCode = ctlCode.replace("                  ->orWhere('employee_code', 'like', \"%{$search}%\");\n", "");
ctlCode = ctlCode.replace("            'employee_code' => $employeeCode,\n", "");

fs.writeFileSync('apps/api/app/Http/Controllers/UserController.php', ctlCode);
console.log('Patched UserController.php for DB-3');
