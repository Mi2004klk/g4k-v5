const fs = require('fs');

let attCode = fs.readFileSync('apps/api/app/Http/Controllers/AttendanceController.php', 'utf8');
attCode = attCode.replace(/status=\"present\"/g, "status='present'");
attCode = attCode.replace(/status=\"late\"/g, "status='late'");
attCode = attCode.replace(/status=\"absent\"/g, "status='absent'");
fs.writeFileSync('apps/api/app/Http/Controllers/AttendanceController.php', attCode);
console.log('Patched AttendanceController.php');

let dashCode = fs.readFileSync('apps/api/app/Http/Controllers/DashboardController.php', 'utf8');
dashCode = dashCode.replace(/status = \"present\"/g, "status = 'present'");
fs.writeFileSync('apps/api/app/Http/Controllers/DashboardController.php', dashCode);
console.log('Patched DashboardController.php');
