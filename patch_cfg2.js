const fs = require('fs');

let code = fs.readFileSync('apps/web/src/components/settings/auto-numbering-config.tsx', 'utf8');

code = code.replace(/\/settings\/auto-numberings/g, '/auto-numberings');

fs.writeFileSync('apps/web/src/components/settings/auto-numbering-config.tsx', code);
console.log('Patched auto-numbering-config.tsx for CFG-2');
