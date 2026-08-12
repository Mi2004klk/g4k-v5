const fs = require('fs');

let code = fs.readFileSync('apps/web/src/components/settings/settings-tabs.tsx', 'utf8');

code = code.replace(/grace_period_minutes/g, 'grace_minutes');

fs.writeFileSync('apps/web/src/components/settings/settings-tabs.tsx', code);
console.log('Patched settings-tabs.tsx for CFG-1');
