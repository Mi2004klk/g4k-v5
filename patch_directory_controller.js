const fs = require('fs');

let code = fs.readFileSync('apps/api/app/Http/Controllers/DirectoryController.php', 'utf8');

// ORG-4: Fix pagination
code = code.replace(/cursorPaginate\(20\)/g, 'paginate(24)');
code = code.replace(/\$users->getCollection\(\)->transform/g, '$users->getCollection()->transform');

fs.writeFileSync('apps/api/app/Http/Controllers/DirectoryController.php', code);
console.log('Patched DirectoryController.php for ORG-4');
